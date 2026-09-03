from sqlalchemy import text
from app.db.session import engine

with engine.begin() as conn:
    print('tables:')
    for row in conn.execute(text("SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).fetchall():
        print(row)
    print('\nprojects columns:')
    for row in conn.execute(text("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' ORDER BY ordinal_position")).fetchall():
        print(row)
    print('\nlocations columns:')
    for row in conn.execute(text("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='locations' ORDER BY ordinal_position")).fetchall():
        print(row)
