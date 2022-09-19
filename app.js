const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const app = express();
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB is Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Returns a list of all states in the state table
//API1
const convertDbStateAPI1 = (dbStateObj) => {
  return {
    stateId: dbStateObj.state_id,
    stateName: dbStateObj.state_name,
    population: dbStateObj.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const stateQueryArray = await db.all(getStatesQuery);
  response.send(
    stateQueryArray.map((eachState) => convertDbStateAPI1(eachState))
  );
});

//Returns a state based on the state ID
//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesListByIdQuery = `select * from state where state_id = ${stateId};`;
  const getStatesListByIdQueryResponse = await db.get(getStatesListByIdQuery);
  response.send(convertDbStateAPI1(getStatesListByIdQueryResponse));
});

//Create a district in the district table, district_id is auto-incremented
//API3

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictQuery = `insert into district(district_name,state_id,cases,cured,active,deaths)
    values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const createDistrictQueryResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
//API4
const convertDistrictIdAPI4 = (dbDistrictObj) => {
  return {
    districtId: dbDistrictObj.district_id,
    districtName: dbDistrictObj.district_name,
    stateId: dbDistrictObj.state_id,
    cases: dbDistrictObj.cases,
    cured: dbDistrictObj.cured,
    active: dbDistrictObj.active,
    deaths: dbDistrictObj.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `SELECT * FROM district WHERE district_id = ${districtId};
    `;
  const getDistrictByIdQueryResponse = await db.get(getDistrictByIdQuery);
  response.send(convertDistrictIdAPI4(getDistrictByIdQueryResponse));
});

//Deletes a district from the district table based on the district ID
//API5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtQuery;
  const updateDistrict = `
  UPDATE district SET
     district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     cured = ${cured},
     active = ${active},
     deaths = ${deaths}
     WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrict);
  response.send(`District Details Updated`);
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
//API7
const convertStateAPI7 = (stateObj) => {
  return {
    totalCases: stateObj.cases,
    totalCured: stateObj.cured,
    totalActive: stateObj.active,
    totalDeaths: stateObj.deaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatesQuery = `
    SELECT 
    sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths FROM district where state_id = ${stateId};
    `;
  const stateByStatesResponse = await db.get(getStateByIDStatesQuery);
  response.send(stateByStatesResponse);
});

// Returns an object containing the state name of a district based on the district ID
//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `select state_id from district where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  console.log(typeof getDistrictIdQueryResponse.state_id);

  const getStateNameQuery = `select state_name as stateName from state where 
    state_id = ${getDistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
