DROP TABLE IF EXISTS Releases;

CREATE TABLE IF NOT EXISTS Releases (
    id STRING PRIMARY KEY,
    repo STRING NOT NULL,

    refHeadRaw TEXT NOT NULL,
    refHead_type as (json_extract(refHeadRaw, '$.type')) STORED,
    refHead_sha as (json_extract(refHeadRaw, '$.sha')) STORED,

    refBaseRaw TEXT NOT NULL,
    refBase_type as (json_extract(refBaseRaw, '$.type')) STORED,
    refBase_sha as (json_extract(refBaseRaw, '$.sha')) STORED,

    createdAt TIMESTAMP NOT NULL,
    queuedTo TIMESTAMP,
    postedAt TIMESTAMP,

    releaseNotesRaw TEXT
);

CREATE INDEX IF NOT EXISTS idxReleasesId ON Releases(id);
