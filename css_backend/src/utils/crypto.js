const crypto = require("crypto");
require("dotenv").config();

/*
|==========================================================================
| CONFIG
|==========================================================================
*/

const ALGORITHM = "aes-256-cbc";
const FIXED_IV  = Buffer.alloc(16, 0);

if (!process.env.SECRET_KEY) {
  throw new Error("SECRET_KEY missing in .env");
}

const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.SECRET_KEY)
  .digest();

/*
|==========================================================================
| ENCRYPT
|==========================================================================
| - normalizes: lowercase + trim
| - deterministic: same input = same ciphertext (fixed IV)
| - use for: save to DB, duplicate check, login lookup
|==========================================================================
*/
function encrypt(text) {
  try {
    if (text === null || text === undefined || text === "") return null;
    const cipher    = crypto.createCipheriv(ALGORITHM, SECRET_KEY, FIXED_IV);
    let   encrypted = cipher.update(String(text).toLowerCase().trim(), "utf8", "hex");
    encrypted      += cipher.final("hex");
    return encrypted;
  } catch (err) {
    console.error("[encrypt] Error:", err.message);
    return null;
  }
}

/*
|==========================================================================
| DECRYPT
|==========================================================================
| - use for: show original value in UI
|==========================================================================
*/
function decrypt(encryptedText) {
  try {
    if (!encryptedText) return null;
    const decipher  = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, FIXED_IV);
    let   decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted      += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[decrypt] Error:", err.message);
    return null;
  }
}

/*
|==========================================================================
| ENCRYPT FIELDS
|==========================================================================
| Encrypt specific fields in an object — use before DB insert/update
|
| const payload = encryptFields(req.body, ["email", "phone"]);
| await dao.create(payload);
|==========================================================================
*/
function encryptFields(data = {}, fields = []) {
  const out = { ...data };
  fields.forEach((field) => {
    if (out[field] !== undefined && out[field] !== null && out[field] !== "") {
      out[field] = encrypt(out[field]);
    }
  });
  return out;
}

/*
|==========================================================================
| DECRYPT ROW
|==========================================================================
| Decrypt specific fields in one sequelize row or plain object
|
| const plain = decryptRow(userRow, ["email", "phone"]);
|==========================================================================
*/
function decryptRow(row = {}, fields = []) {
  const data = row.toJSON ? row.toJSON() : { ...row };
  fields.forEach((field) => {
    if (data[field]) data[field] = decrypt(data[field]);
  });
  return data;
}

/*
|==========================================================================
| DECRYPT ROWS
|==========================================================================
| Decrypt specific fields across an array of rows
|
| const plain = decryptRows(userRows, ["email", "phone"]);
|==========================================================================
*/
function decryptRows(rows = [], fields = []) {
  return rows.map((row) => decryptRow(row, fields));
}

/*
|==========================================================================
| BUILD ENCRYPT WHERE
|==========================================================================
| Build a Sequelize WHERE clause with encrypted values for exact-match
|
| const where = buildEncryptWhere({ email: "test@gmail.com", status: "active" }, ["email"]);
| // → { email: "a3f1c9...", status: "active" }
| await dao.findOneByWhere(where);
|==========================================================================
*/
function buildEncryptWhere(conditions = {}, encryptedFields = []) {
  const where = { ...conditions };
  encryptedFields.forEach((field) => {
    if (where[field] !== undefined && where[field] !== null && where[field] !== "") {
      where[field] = encrypt(where[field]);
    }
  });
  return where;
}

/*
|==========================================================================
| DECRYPT + SEARCH + PAGINATE
|==========================================================================
|
| Core pipeline utility used by getList internally.
| Call directly when you already have fetched rows.
|
| MODE A — no search:
|   Pass DB-paginated rows + DB totalCount
|   → just decrypt, correct pagination meta from DB count
|
| MODE B — search keyword:
|   Pass ALL rows (no DB LIMIT applied)
|   → decrypt → JS .includes() filter → slice for page
|
|--------------------------------------------------------------------------
| PARAMS:
|   rows         → sequelize rows (array)
|   fields       → encrypted column names to decrypt
|   searchFields → which decrypted fields to partial-search
|                  (defaults to same as fields)
|   omitFields   → fields to delete before returning e.g. ["password"]
|   search       → partial keyword e.g. "prab" matches "prabha@gmail.com"
|   totalCount   → DB count — pass only in MODE A for correct meta
|   page, limit
|==========================================================================
*/
function decryptSearchPaginate({
  rows         = [],
  fields       = [],
  searchFields = null,
  omitFields   = [],
  search       = "",
  totalCount   = null,
  page         = 1,
  limit        = 10,
}) {
  page  = parseInt(page)  || 1;
  limit = parseInt(limit) || 10;

  const _searchFields = searchFields || fields;
  const hasSearch     = search && search.trim() !== "";

  /* STEP 1 — decrypt all rows */
  let data = rows.map((row) => {
    const decrypted = decryptRow(row, fields);
    omitFields.forEach((f) => delete decrypted[f]);
    return decrypted;
  });

  /* STEP 2 — partial JS filter (only runs in MODE B) */
  if (hasSearch) {
    const keyword = search.toLowerCase().trim();
    data = data.filter((row) =>
      _searchFields.some(
        (field) =>
          row[field] &&
          String(row[field]).toLowerCase().includes(keyword)
      )
    );
  }

  /* STEP 3 — pagination */
  const totalItems    = hasSearch ? data.length : (totalCount ?? data.length);
  const totalPages    = Math.ceil(totalItems / limit);
  const offset        = (page - 1) * limit;
  const paginatedData = hasSearch
    ? data.slice(offset, offset + limit) // MODE B: slice filtered array
    : data;                              // MODE A: already sliced by DB

  return { totalItems, totalPages, currentPage: page, data: paginatedData };
}

/*
|==========================================================================
| RESOLVE DAO METHODS (internal helper)
|==========================================================================
| Normalizes differences between Sequelize Model and DAO instance
| so all public functions accept either one transparently.
|
| Sequelize Model has : .findOne(), .findAll(), .findAndCountAll()
| DAO instance has    : .findOneByWhere(), .findAll(), .findAndCountAll()
|                       (depends on your base DAO implementation)
|==========================================================================
*/
function _resolveMethods(ModelOrDao) {
  if (!ModelOrDao) {
    throw new Error(
      "[crypto util] Received null/undefined instead of a Model or DAO.\n" +
      "Fix: pass a Sequelize model (e.g. models.user) or a DAO instance.\n" +
      "If using models.user, check that the key matches models/index.js " +
      "(could be models.User, models.users — check exact name)."
    );
  }

  /* findOne */
  const findOne =
    typeof ModelOrDao.findOne        === "function" ? (w) => ModelOrDao.findOne({ where: w })
  : typeof ModelOrDao.findOneByWhere === "function" ? (w) => ModelOrDao.findOneByWhere(w)
  : null;

  /* findAll */
  const findAll =
    typeof ModelOrDao.findAll === "function"
      ? (opts) => ModelOrDao.findAll(opts)
      : null;

  /* findAndCountAll */
  const findAndCountAll =
    typeof ModelOrDao.findAndCountAll === "function"
      ? (opts) => ModelOrDao.findAndCountAll(opts)
      : null;

  if (!findAll) {
    throw new Error(
      "[crypto util] Model/DAO must have a findAll() method. " +
      "Received type: " + typeof ModelOrDao
    );
  }

  return { findOne, findAll, findAndCountAll };
}

/*
|==========================================================================
| getOne
|==========================================================================
| Fetch + decrypt a single row by plain-column WHERE.
| Accepts Sequelize Model or DAO instance.
|
| // with DAO
| const user = await getOne(this.userDao, { user_id }, ["email","phone"], ["password"]);
|
| // with Model
| const user = await getOne(models.user, { user_id }, ["email","phone"], ["password"]);
|==========================================================================
*/
async function getOne(ModelOrDao, where = {}, fields = [], omitFields = []) {
  const { findOne } = _resolveMethods(ModelOrDao);

  if (!findOne) {
    throw new Error(
      "[getOne] Model/DAO must have findOne() or findOneByWhere() method."
    );
  }

  const row = await findOne(where);
  if (!row) return null;

  const data = decryptRow(row, fields);
  omitFields.forEach((f) => delete data[f]);
  return data;
}

/*
|==========================================================================
| getOneByEncrypted
|==========================================================================
| Find by an encrypted field value — encrypts conditions before querying,
| then decrypts the result. Use for login / duplicate check / lookup.
|
| const user = await getOneByEncrypted(
|   this.userDao,
|   { email: "test@gmail.com" },  // plain input
|   ["email"],                    // encrypt these before WHERE
|   ["email", "phone"],           // decrypt these from result
|   ["password"]                  // omit from result
| );
|==========================================================================
*/
async function getOneByEncrypted(
  ModelOrDao,
  conditions     = {},
  encryptFields_ = [],
  decryptFields_ = [],
  omitFields     = []
) {
  const { findOne } = _resolveMethods(ModelOrDao);

  if (!findOne) {
    throw new Error(
      "[getOneByEncrypted] Model/DAO must have findOne() or findOneByWhere() method."
    );
  }

  const where = buildEncryptWhere(conditions, encryptFields_);
  const row   = await findOne(where);
  if (!row) return null;

  const data = decryptRow(row, decryptFields_);
  omitFields.forEach((f) => delete data[f]);
  return data;
}

/*
|==========================================================================
| getList
|==========================================================================
| Fetch a list with optional partial search on encrypted fields + pagination.
| Accepts Sequelize Model or DAO instance.
|
| AUTO MODE:
|   No search → DB LIMIT/OFFSET → fast (decrypt page-size rows only)
|   Search    → fetch all → decrypt → JS .includes() filter → slice
|
|--------------------------------------------------------------------------
| USAGE with DAO (recommended — matches your existing pattern):
|
|   const result = await getList(this.userDao, {
|     where:        { status: "active" },
|     fields:       ["email", "phone"],
|     searchFields: ["email", "phone"],
|     omitFields:   ["password"],
|     search:       query.search,
|     page:         query.page,
|     limit:        query.limit,
|   });
|
| USAGE with Sequelize Model:
|
|   const result = await getList(models.user, { ... });
|   (models.user must be defined — check models/index.js key name)
|
|--------------------------------------------------------------------------
| PARAMS:
|   ModelOrDao    → Sequelize Model OR DAO instance
|   where         → plain-column filters (NOT encrypted fields)
|   fields        → encrypted column names to decrypt
|   searchFields  → partial search on these fields after decrypt
|   omitFields    → remove from output e.g. ["password"]
|   search        → partial keyword e.g. "prab"
|   page, limit
|   order         → Sequelize order array
|   include       → Sequelize associations to include
|   attributes    → specific columns to SELECT
|==========================================================================
*/
async function getList(ModelOrDao, {
  where        = {},
  fields       = [],
  searchFields = null,
  omitFields   = [],
  search       = "",
  page         = 1,
  limit        = 10,
  order        = [["created_at", "DESC"]],
  include      = [],
  attributes   = undefined,
} = {}) {
  page  = parseInt(page)  || 1;
  limit = parseInt(limit) || 10;

  const { findAll, findAndCountAll } = _resolveMethods(ModelOrDao);

  const baseOptions = {
    where,
    order,
    include,
    ...(attributes ? { attributes } : {}),
  };

  const hasSearch = search && search.trim() !== "";

  /*
  |--------------------------------------------------------------------------
  | MODE A — No search → DB handles LIMIT + OFFSET
  | Only decrypt page-size rows → fast for large tables
  |--------------------------------------------------------------------------
  */
  if (!hasSearch) {
    const offset = (page - 1) * limit;

    let rows, count;

    if (findAndCountAll) {
      const result = await findAndCountAll({ ...baseOptions, limit, offset });
      rows  = result.rows;
      count = result.count;
    } else {
      // fallback if DAO only has findAll
      rows  = await findAll({ ...baseOptions, limit, offset });
      count = rows.length;
    }

    const decryptedRows = rows.map((row) => {
      const data = decryptRow(row, fields);
      omitFields.forEach((f) => delete data[f]);
      return data;
    });

    return {
      totalItems:  count,
      totalPages:  Math.ceil(count / limit),
      currentPage: page,
      data:        decryptedRows,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | MODE B — Search present → fetch ALL → decrypt → JS filter → slice
  |--------------------------------------------------------------------------
  */
  const allRows = await findAll({ ...baseOptions }); // no limit/offset

  return decryptSearchPaginate({
    rows:         allRows,
    fields,
    searchFields,
    omitFields,
    search,
    page,
    limit,
  });
}

/*
|==========================================================================
| EXPORTS
|==========================================================================
*/
module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptRow,
  decryptRows,
  buildEncryptWhere,
  decryptSearchPaginate,
  getOne,
  getOneByEncrypted,
  getList,
};