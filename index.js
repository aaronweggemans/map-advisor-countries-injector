require('dotenv').config();
const fs = require('fs').promises;
const mysql = require('mysql2');

async function readFileAndStartConnection() {
  try {
    const countriesFile = await fs.readFile(
      './datasets/world-administrative-boundaries-countries.json',
      'utf8'
    );
    const countries = JSON.parse(countriesFile);

    const subDataFile = await fs.readFile(
      './datasets/general-country-information.json',
      'utf8'
    );
    const subData = JSON.parse(subDataFile);

    // Start de databaseverbinding en voer de query's uit
    await startConnection(countries, subData);
  } catch (error) {
    console.error('Er is een fout opgetreden:', error);
  }
}

async function startConnection(countries, subData) {
  console.log(`Connecting with host: \t ${process.env.DB_HOST}`);

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE,
  });

  const importCountries = countries
    .map(
      (country, id) =>
        `(${id + 1}, "${country.english_short}", ${country.geo_point_2d.lat}, ${
          country.geo_point_2d.lon
        })`
    )
    .join();

  const importQuestions = countries
    .map((country, id) => {
      const country_id = id + 1;

      const foundCountry = subData.find((subData) => {
        const conversed = subData.country
          .replace(/\(.*?\)/g, '')
          .replaceAll(' ', '')
          .replaceAll('.', '')
          .toLowerCase()
          .trim();

        return country.preferred_term
          .replace(/\(.*?\)/g, '')
          .replaceAll(' ', '')
          .replaceAll('.', '')
          .toLowerCase()
          .trim()
          .includes(conversed);
      });

      const questionOne = `(${country_id}, "Het land begint met de letter '${country.english_short[0]}'")`;
      const questionTwo = `(${country_id}, "Het land ligt in ${country.region_name}")`;
      const questionThree =
        foundCountry?.population !== undefined
          ? `(${country_id}, "Het land heeft ${foundCountry.population} aantal inwoners")`
          : '';
      const questionFour =
        foundCountry?.coastline === '0,00'
          ? `(${country_id}, "Het land is een binnenstaat")`
          : `(${country_id}, "Het land ligt tegen de zee aan")`;
      const questionFive = foundCountry?.population_density_sq_mi
        ? `(${country_id}, "Het land heeft een bevolkingsdichtheid van ${(
            +foundCountry.population_density_sq_mi * 2.59
          ).toString()} vierkante kilometer")`
        : '';

      return [
        questionOne,
        questionTwo,
        questionThree,
        questionFour,
        questionFive,
      ]
        .filter(Boolean)
        .join();
    })
    .join();

  // Verbinden met de database
  connection.connect();

  try {
    console.log('Connected! \n');
    console.log('Creating new table named: countries...');

    await queryAsync(
      connection,
      'DROP TABLE IF EXISTS `map_advisor_db`.`questions`'
    );
    await queryAsync(
      connection,
      'DROP TABLE IF EXISTS `map_advisor_db`.`countries`'
    );
    await queryAsync(
      connection,
      'CREATE TABLE IF NOT EXISTS `countries` (`id` bigint(20) UNIQUE NOT NULL AUTO_INCREMENT, `country_name` VARCHAR(255) NOT NULL, `latitude` decimal(8,6), `longitude` decimal(9,6));'
    );

    console.log('Table countries is created... \n');
    console.log('Creating new table named: questions...');

    await queryAsync(
      connection,
      'CREATE TABLE IF NOT EXISTS `questions` (`id` bigint(20) UNIQUE NOT NULL AUTO_INCREMENT, `country_id` bigint(20) NOT NULL, `description` VARCHAR(255) NOT NULL, FOREIGN KEY (`country_id`) REFERENCES countries(`id`));'
    );

    console.log('Table questions is created... \n');
    console.log('Now importing json file... \n');

    await queryAsync(
      connection,
      `INSERT INTO countries (id, country_name, latitude, longitude) VALUES ${importCountries}`
    );

    await queryAsync(
      connection,
      `INSERT INTO questions (country_id, description) VALUES ${importQuestions}`
    );
  } catch (error) {
    console.error(
      'Er is een fout opgetreden tijdens het uitvoeren van de queries:',
      error
    );
  } finally {
    console.log('Done......');
    connection.end();
  }
}

function queryAsync(connection, query) {
  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

// Start de procedure
readFileAndStartConnection();
