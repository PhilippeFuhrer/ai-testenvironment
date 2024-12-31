import * as lancedb from "@lancedb/lancedb";

//initializing DataBase
async function initialize() {
  const db = await lancedb.connect("./lanceDB");
  const tableNames = await db.tableNames();
  console.log("Existing tables: " + tableNames);
}

// add data to table
async function addData() {
  const db = await lancedb.connect("./lanceDB");
  const table = await db.openTable("myTable");

  const data = [
    { vector: [1.3, 1.4], item: "fizz", price: 100.0 },
    { vector: [9.5, 56.2], item: "buzz", price: 200.0 },
  ];
  await table.add(data);

}

//creating a new table
async function createTable() {
  const db = await lancedb.connect("./lanceDB");
  const testTable = await db.createTable(
    "myTable",
    [
      { vector: [3.1, 4.1], item: "foo", price: 10.0 },
      { vector: [5.9, 26.5], item: "bar", price: 20.0 },
    ],
    { mode: "overwrite" }
  );
}

initialize();
addData();
