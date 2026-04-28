-- Fix categories for ML/DS skills that landed in Other
UPDATE "Skill" SET "category" = 'Data'
WHERE "name" IN (
  'CatBoost', 'LightGBM', 'XGBoost', 'MLflow', 'Seaborn', 'Matplotlib',
  'Machine Learning', 'Линейная алгебра', 'Математическая статистика', 'Теория вероятностей'
);

UPDATE "Skill" SET "category" = 'Database'
WHERE "name" = 'SQL';

-- Add missing ML/DS skills
INSERT INTO "Skill" ("id", "name", "category", "aliases", "createdAt")
VALUES
  (gen_random_uuid(), 'Keras',          'Data', ARRAY['keras'],              NOW()),
  (gen_random_uuid(), 'SciPy',          'Data', ARRAY['scipy'],              NOW()),
  (gen_random_uuid(), 'Statsmodels',    'Data', ARRAY['statsmodels'],        NOW()),
  (gen_random_uuid(), 'Plotly',         'Data', ARRAY['plotly'],             NOW()),
  (gen_random_uuid(), 'NLTK',           'Data', ARRAY['nltk'],               NOW()),
  (gen_random_uuid(), 'spaCy',          'Data', ARRAY['spacy'],              NOW()),
  (gen_random_uuid(), 'HuggingFace',    'Data', ARRAY['huggingface', 'hf'], NOW()),
  (gen_random_uuid(), 'Transformers',   'Data', ARRAY['transformers'],       NOW()),
  (gen_random_uuid(), 'OpenCV',         'Data', ARRAY['opencv', 'cv2'],      NOW()),
  (gen_random_uuid(), 'Rapids',         'Data', ARRAY['rapids', 'cudf'],     NOW()),
  (gen_random_uuid(), 'Polars',         'Data', ARRAY['polars'],             NOW()),
  (gen_random_uuid(), 'DVC',            'Data', ARRAY['dvc'],                NOW()),
  (gen_random_uuid(), 'Optuna',         'Data', ARRAY['optuna'],             NOW()),
  (gen_random_uuid(), 'Ray',            'Data', ARRAY['ray'],                NOW()),
  (gen_random_uuid(), 'A/B тестирование', 'Data', ARRAY['ab testing', 'a/b testing'], NOW()),
  (gen_random_uuid(), 'Feature Engineering', 'Data', ARRAY['feature engineering'], NOW()),
  (gen_random_uuid(), 'Deep Learning',  'Data', ARRAY['deep learning', 'dl'], NOW()),
  (gen_random_uuid(), 'NLP',            'Data', ARRAY['nlp', 'natural language processing'], NOW()),
  (gen_random_uuid(), 'Computer Vision','Data', ARRAY['computer vision', 'cv'], NOW()),
  (gen_random_uuid(), 'Recommender Systems', 'Data', ARRAY['recommender systems', 'recsys'], NOW()),
  (gen_random_uuid(), 'Time Series',    'Data', ARRAY['time series', 'временные ряды'], NOW()),
  (gen_random_uuid(), 'ClickHouse',     'Database', ARRAY['clickhouse'],     NOW()),
  (gen_random_uuid(), 'Apache Kafka',   'DevOps',   ARRAY['kafka'],          NOW()),
  (gen_random_uuid(), 'Apache Spark',   'Data',     ARRAY['apache spark', 'pyspark'], NOW()),
  (gen_random_uuid(), 'Hadoop',         'Data',     ARRAY['hadoop'],         NOW()),
  (gen_random_uuid(), 'Hive',           'Data',     ARRAY['hive', 'apache hive'], NOW()),
  (gen_random_uuid(), 'R',              'Data',     ARRAY[]::text[],          NOW()),
  (gen_random_uuid(), 'MATLAB',         'Data',     ARRAY['matlab'],          NOW())
ON CONFLICT ("name") DO UPDATE SET "category" = EXCLUDED."category";
