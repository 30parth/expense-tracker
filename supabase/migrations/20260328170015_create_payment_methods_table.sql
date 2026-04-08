CREATE TABLE payment_type (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    payment_name    VARCHAR(100)    NOT NULL,
    payment_slug    VARCHAR(120)    NOT NULL UNIQUE,
    current_balance NUMERIC(15, 2)  NOT NULL DEFAULT 0.00,
    created_by      BIGINT          REFERENCES users (id) ON DELETE SET NULL,
    updated_by      BIGINT          REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);