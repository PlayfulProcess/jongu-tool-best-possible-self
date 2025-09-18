-- COMPLETE SCHEMA BACKUP - Single Query Approach
-- Run this in Supabase SQL Editor and save the output

-- =====================================================
-- GENERATE COMPLETE SCHEMA DDL
-- =====================================================

-- This query will generate the complete CREATE TABLE statements for all tables
SELECT
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || CHR(10) ||
    STRING_AGG(
        '  ' || column_name || ' ' ||
        CASE
            WHEN data_type = 'character varying' THEN 'varchar(' || character_maximum_length || ')'
            WHEN data_type = 'timestamp with time zone' THEN 'timestamptz'
            WHEN data_type = 'timestamp without time zone' THEN 'timestamp'
            WHEN data_type = 'USER-DEFINED' THEN udt_name
            ELSE data_type
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ',' || CHR(10)
    ) || CHR(10) || ');' || CHR(10) || CHR(10) AS create_statement
FROM information_schema.columns c
JOIN pg_tables t ON c.table_name = t.tablename
WHERE c.table_schema = 'public'
  AND t.schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Alternative if the above doesn't work - use pg_dump style query
SELECT
    'Table: ' || tablename || CHR(10) ||
    'Schema: ' || CHR(10) ||
    STRING_AGG(
        column_name || ' ' || data_type ||
        CASE WHEN character_maximum_length IS NOT NULL
             THEN '(' || character_maximum_length || ')'
             ELSE '' END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE ' NULL' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        CHR(10)
    ) || CHR(10) || CHR(10) AS table_definition
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY tablename
ORDER BY tablename;