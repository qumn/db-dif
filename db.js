import mysql from 'mysql-await';

class DbContext {
  constructor(config) {
    this.master = getConnect(config.master);
    this.masterDbName = config.master.database;
    this.slave = getConnect(config.slave);
    this.slaveDbName = config.slave.database;
  }
}

function getConnect({ host, port, user, password, database }) {
  const connection = mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });
  connection.on(`error`, (err) => {
    console.error(`Connection error ${err.code}`);
  });
  return connection;
}

async function getTableColumns(conn, dbName, tableName) {
  const sql = `
  select
    TABLE_CATALOG           ,
    TABLE_SCHEMA            ,
    TABLE_NAME              ,
    COLUMN_NAME             ,
    ORDINAL_POSITION        ,
    COLUMN_DEFAULT          ,
    IS_NULLABLE             ,
    DATA_TYPE               ,
    CHARACTER_MAXIMUM_LENGTH,
    CHARACTER_OCTET_LENGTH  ,
    NUMERIC_PRECISION       ,
    NUMERIC_SCALE           ,
    DATETIME_PRECISION      ,
    CHARACTER_SET_NAME      ,
    COLLATION_NAME          ,
    COLUMN_TYPE             ,
    COLUMN_KEY              ,
    EXTRA                   ,
    PRIVILEGES              ,
    COLUMN_COMMENT          ,
    GENERATION_EXPRESSION   ,
    SRS_ID                  ,
  from information_schema.columns
  where
    table_schema=? and table_name=?
  `
  return (await conn.awaitQuery(sql, [dbName, tableName])).reduce((acc, cur) => {
    acc[cur.COLUMN_NAME] = cur;
    return acc;
  }, {});
}

async function checkColumnDefineEqual(master, slave, tableName, checkColumns) {
  const masterColumns = await getTableColumns(master, masterDbName, tableName);
  const slaveColumns = await getTableColumns(slave, masterDbName, tableName);

  for (const checkColumn of checkColumns) {
    const masterColumn = masterColumns[checkColumn];
    const slaveColumn = slaveColumns[checkColumn];
    if (!masterColumn) {
      console.error(`master column ${checkColumn} not exists`);
      return false;
    }
    if (!slaveColumn) {
      console.error(`slave column ${checkColumn} not exists`);
      return false;
    }
    if (masterColumn.COLUMN_TYPE !== slaveColumn.COLUMN_TYPE) {
      console.error(`column ${checkColumn} type not equal`);
      console.error(`master: ${masterColumn.COLUMN_TYPE}\n slave: ${slaveColumn.COLUMN_TYPE}`);
      return false;
    }
  }
  return true;
}

DbContext.prototype.checkColumnDefineEqual = checkColumnDefineEqual;

export default DbContext;
