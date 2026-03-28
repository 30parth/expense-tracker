CREATE TABLE users (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    created_by  BIGINT          REFERENCES public.users (id) ON DELETE SET NULL,
    updated_by  BIGINT          REFERENCES public.users (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);