const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "covid19India.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDBAndServer();

//APT 1 GET

const convertStateDbObjectToAPI1 = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `
    select * from state;`;
  const dbResponse = await db.all(getStateQuery);
  response.send(
    dbResponse.map((eachState) => convertStateDbObjectToAPI1(eachState))
  );
});

//API 2 GET

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateListByIdQuery = `
    select * from state where state_id= ${stateId};
    `;
  const dbResponse = await db.get(getStateListByIdQuery);
  response.send(convertStateDbObjectToAPI1(dbResponse));
});

//API 3 POST

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
    insert into district(district_name, state_id, cases, cured, active, deaths)
    values ("${districtName}", ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const dbResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4 GET

const convertDbObjectToAPI4 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdByQuery = `
    select * from district where district_id= ${districtId};`;
  const dbResponse = await db.get(getDistrictIdByQuery);
  response.send(convertDbObjectToAPI4(dbResponse));
});

//API 5 DELETE

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    delete from district where district_id = ${districtId};`;
  const dbResponse = await db.run(deleteQuery);
  response.send("District Removed");
});

//API 6 PUT

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    update district set 
    district_name= "${districtName}",
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    where district_id = ${districtId};`;
  const dbResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7 GET

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths from district where state_id = ${stateId};`;
  const dbResponse = await db.get(getStatisticQuery);
  response.send(dbResponse);
});

//API 8 GET

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdByAPI8 = `
    select state_id from district where district_id =${districtId};`;
  const dbResponse = await db.get(getDistrictIdByAPI8);
  const getStateQuery = `
    select state_name as stateName from state where state_id = ${dbResponse.state_id}`;
  const getStateNameQuery = await db.get(getStateQuery);
  response.send(getStateNameQuery);
});

module.exports = app;
