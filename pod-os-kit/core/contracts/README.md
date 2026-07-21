# Data Contracts

JSON shapes shared between engines (writers) and the banner (reader). Engines write; the banner reads; the banner-action function does instant writes. One writer per file per window. Every file carries `version` and an `updated`/`ts` stamp.
