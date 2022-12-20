CREATE TABLE users(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    username VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email_address VARCHAR NOT NULL,
    phone_number VARCHAR NOT NULL,
    active BOOLEAN NOT NULL
);

CREATE TABLE user_refresh_tokens(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    token VARCHAR NOT NULL,
    created TIMESTAMP NOT NULL,
    expiry_time TIMESTAMP NOT NULL
);

CREATE TABLE roles(
    id SERIAL NOT NULL PRIMARY KEY,
    type VARCHAR NOT NULL 
);
CREATE TABLE user_roles(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    role_id INTEGER REFERENCES roles(id) NOT NULL
);

INSERT INTO roles(type) VALUES('ADMIN');
INSERT INTO roles(type) VALUES('USER');