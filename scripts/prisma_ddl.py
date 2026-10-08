#!/usr/bin/env python3
"""Tiny Prisma-schema -> Postgres DDL helper, used because the Prisma schema engine
cannot be downloaded in some sandboxes. Mirrors Prisma's naming conventions.

  prisma_ddl.py create <Model|Enum>...   print CREATE TYPE / TABLE / INDEX / FK statements
  prisma_ddl.py check-sql                print one SQL query that lists drift vs a live DB
"""
import re, sys

SCHEMA = 'prisma/schema.prisma'
SCALARS = {'String': 'TEXT', 'Int': 'INTEGER', 'Float': 'DOUBLE PRECISION', 'Boolean': 'BOOLEAN',
           'DateTime': 'TIMESTAMP(3)', 'Json': 'JSONB'}
INFO = {'TEXT': 'text', 'INTEGER': 'integer', 'DOUBLE PRECISION': 'double precision', 'BOOLEAN': 'boolean',
        'TIMESTAMP(3)': 'timestamp without time zone', 'JSONB': 'jsonb'}


def parse(text):
    models, enums = {}, {}
    for kind, name, body in re.findall(r'^(model|enum)\s+(\w+)\s*\{(.*?)^\}', text, re.S | re.M):
        if kind == 'enum':
            vals = []
            for ln in body.splitlines():
                ln = ln.split('//')[0].strip()
                if not ln or ln.startswith('@@'):
                    continue
                m = re.match(r'(\w+)(?:\s+@map\("([^"]+)"\))?', ln)
                vals.append((m.group(1), m.group(2) or m.group(1)))
            enums[name] = vals
            continue
        fields, attrs = [], []
        for ln in body.splitlines():
            ln = ln.split('//')[0].strip()
            if not ln:
                continue
            if ln.startswith('@@'):
                attrs.append(ln)
                continue
            m = re.match(r'(\w+)\s+(\w+)(\?|\[\])?\s*(.*)', ln)
            fields.append(dict(name=m.group(1), type=m.group(2), opt=m.group(3) == '?', list=m.group(3) == '[]', attrs=m.group(4)))
        models[name] = dict(fields=fields, attrs=attrs)
    return models, enums


def cols(s):
    return [c.strip() for c in s.split(',')]


def analyse(models, enums):
    for mn, m in models.items():
        m['columns'], m['fks'], m['uniques'], m['indexes'], m['pk'] = [], [], [], [], None
        for f in m['fields']:
            t = f['type']
            if t in SCALARS or t in enums:
                f['scalar'] = True
                m['columns'].append(f)
                if '@id' in f['attrs']:
                    m['pk'] = [f['name']]
                if '@unique' in f['attrs']:
                    m['uniques'].append([f['name']])
            elif t in models:
                r = re.search(r'@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\](?:[^)]*onDelete:\s*(\w+))?', f['attrs'])
                if r:
                    m['fks'].append(dict(cols=cols(r.group(1)), refs=cols(r.group(2)), target=t, onDelete=r.group(3),
                                         optional=f['opt']))
        for a in m['attrs']:
            k = re.match(r'@@(\w+)\(\[([^\]]+)\]', a)
            if not k:
                continue
            kind, cs = k.group(1), cols(k.group(2))
            if kind == 'id': m['pk'] = cs
            elif kind == 'unique': m['uniques'].append(cs)
            elif kind == 'index': m['indexes'].append(cs)


def coltype(f, enums):
    t = f['type']
    base = SCALARS[t] if t in SCALARS else f'"{t}"'
    return base + ('[]' if f['list'] else '')


def default_sql(f, enums):
    m = re.search(r'@default\((.*?)\)(?:\s|$)', f['attrs'])
    if not m:
        return None
    v = m.group(1)
    if v in ('cuid()', 'uuid()', 'autoincrement()'): return None
    if v == 'now()': return 'CURRENT_TIMESTAMP'
    if v in ('true', 'false'): return v
    if v == '[]': return f"ARRAY[]::{SCALARS.get(f['type'], 'TEXT')}[]"
    if re.fullmatch(r'-?\d+(\.\d+)?', v): return v
    if v.startswith('"'): return "'" + v.strip('"').replace("'", "''") + "'"
    if f['type'] in enums:
        return "'" + dict(enums[f['type']])[v] + "'"
    raise SystemExit(f'unhandled default {v}')


def fk_action(fk):
    d = fk['onDelete']
    if d == 'Cascade': return 'CASCADE'
    if d == 'SetNull': return 'SET NULL'
    return 'SET NULL' if fk['optional'] else 'RESTRICT'


def q(cs): return ', '.join(f'"{c}"' for c in cs)


def create(models, enums, names):
    out = []
    for n in names:
        if n in enums:
            out.append(f'-- CreateEnum\nCREATE TYPE "{n}" AS ENUM (' + ', '.join(f"'{db}'" for _, db in enums[n]) + ');\n')
    for n in names:
        if n not in models: continue
        m = models[n]
        lines = []
        for f in m['columns']:
            s = f'    "{f["name"]}" {coltype(f, enums)}'
            if not f['opt'] and not f['list'] or (f['list']): s += ' NOT NULL'
            d = default_sql(f, enums)
            if d is not None: s += f' DEFAULT {d}'
            lines.append(s)
        lines.append(f'\n    CONSTRAINT "{n}_pkey" PRIMARY KEY ({q(m["pk"])})')
        out.append(f'-- CreateTable\nCREATE TABLE "{n}" (\n' + ',\n'.join(lines) + '\n);\n')
    for n in names:
        if n not in models: continue
        m = models[n]
        for u in m['uniques']:
            out.append(f'-- CreateIndex\nCREATE UNIQUE INDEX "{n}_{"_".join(u)}_key" ON "{n}"({q(u)});\n')
        for i in m['indexes']:
            out.append(f'-- CreateIndex\nCREATE INDEX "{n}_{"_".join(i)}_idx" ON "{n}"({q(i)});\n')
    for n in names:
        if n not in models: continue
        for fk in models[n]['fks']:
            out.append(f'-- AddForeignKey\nALTER TABLE "{n}" ADD CONSTRAINT "{n}_{"_".join(fk["cols"])}_fkey" FOREIGN KEY ({q(fk["cols"])}) '
                       f'REFERENCES "{fk["target"]}"({q(fk["refs"])}) ON DELETE {fk_action(fk)} ON UPDATE CASCADE;\n')
    return '\n'.join(out)


def check_sql(models, enums):
    rows = []
    for n, m in models.items():
        for f in m['columns']:
            if f['type'] in enums:
                dt = 'USER-DEFINED'
            elif f['list']:
                dt = 'ARRAY'
            else:
                dt = INFO[SCALARS[f['type']]]
            nullable = 'YES' if (f['opt']) else 'NO'
            rows.append(f"('{n}','{f['name']}','{dt}','{nullable}')")
    idx = []
    fks = []
    for n, m in models.items():
        for u in m['uniques']: idx.append(f"'{n}_{'_'.join(u)}_key'")
        for i in m['indexes']: idx.append(f"'{n}_{'_'.join(i)}_idx'")
        idx.append(f"'{n}_pkey'")
        for fk in m['fks']:
            fks.append(f"('{n}_{'_'.join(fk['cols'])}_fkey','{fk_action(fk)}')")
    return f"""
WITH exp(t,c,dt,nl) AS (VALUES {','.join(rows)}),
act AS (SELECT table_name t, column_name c, data_type dt, is_nullable nl FROM information_schema.columns WHERE table_schema='public'),
expidx(n) AS (VALUES {','.join('('+i+')' for i in idx)}),
actidx AS (SELECT indexname n FROM pg_indexes WHERE schemaname='public'),
expfk(n,a) AS (VALUES {','.join(fks)}),
actfk AS (SELECT conname n, CASE confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'r' THEN 'RESTRICT' WHEN 'a' THEN 'NO ACTION' ELSE confdeltype::text END a
          FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace)
SELECT 'column' kind, e.t||'.'||e.c what, 'expected '||e.dt||'/'||e.nl||' got '||coalesce(a.dt||'/'||a.nl,'MISSING') detail
  FROM exp e LEFT JOIN act a ON a.t=e.t AND a.c=e.c WHERE a.c IS NULL OR a.dt<>e.dt OR a.nl<>e.nl
UNION ALL SELECT 'extra column', a.t||'.'||a.c, '' FROM act a LEFT JOIN exp e ON a.t=e.t AND a.c=e.c
  WHERE e.c IS NULL AND a.t IN (SELECT DISTINCT t FROM exp) AND a.t<>'_prisma_migrations'
UNION ALL SELECT 'index', e.n, 'MISSING' FROM expidx e LEFT JOIN actidx a USING(n) WHERE a.n IS NULL
UNION ALL SELECT 'fk', e.n, 'expected '||e.a||' got '||coalesce(a.a,'MISSING') FROM expfk e LEFT JOIN actfk a USING(n) WHERE a.n IS NULL OR a.a<>e.a
UNION ALL SELECT 'extra fk', a.n, a.a FROM actfk a LEFT JOIN expfk e USING(n) WHERE e.n IS NULL;
"""


if __name__ == '__main__':
    models, enums = parse(open(SCHEMA).read())
    analyse(models, enums)
    cmd = sys.argv[1]
    if cmd == 'create':
        print(create(models, enums, sys.argv[2:]))
    elif cmd == 'check-sql':
        print(check_sql(models, enums))
    elif cmd == 'models':
        print(' '.join(models)); print(' '.join(enums))
