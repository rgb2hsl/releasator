CREATE TABLE IF NOT EXISTS Releases (
    id STRING PRIMARY KEY,
    repo STRING NOT NULL,

    refHeadRaw TEXT NOT NULL,
    refHead_type as (json_extract(refHeadRaw, '$.type')) STORED,
    refHead_name as (json_extract(refHeadRaw, '$.name')) STORED,

    refBaseRaw TEXT NOT NULL,
    refBase_type as (json_extract(refBaseRaw, '$.type')) STORED,
    refBase_name as (json_extract(refBaseRaw, '$.name')) STORED,

    createdAt TIMESTAMP NOT NULL,
    queuedTo TIMESTAMP,
    postedAt TIMESTAMP,

    releaseNotesRaw TEXT,

    editHash STRING
);

CREATE INDEX IF NOT EXISTS idxReleasesId ON Releases(id);
