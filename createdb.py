import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


conn = psycopg2.connect(user="postgres", password="your_postgres_password", host="127.0.0.1", port="5432")
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cursor = conn.cursor()


cursor.execute("CREATE DATABASE solarwind;")
print("Database 'solarwind' created successfully!")

cursor.close()
conn.close()