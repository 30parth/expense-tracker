CREATE TABLE transaction (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    transaction_name    VARCHAR(100)    NOT NULL,
    payment_method_id   BIGINT          NOT NULL REFERENCES payment_type (id) ON DELETE RESTRICT,
    description         TEXT,
    created_by          BIGINT          REFERENCES users (id) ON DELETE SET NULL,
    updated_by          BIGINT          REFERENCES users (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);