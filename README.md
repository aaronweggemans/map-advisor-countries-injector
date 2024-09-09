# Countries injector

This application is made to easily inject countries into a database for a hobby project.

The idea of this script is that it makes a connection to a database.

Based on the json files in the `datasets` folders, it fetches multiple questions based on a country.

When running the script with `npm run start` it will execute:

- A injection to create a table `countries`.
- A injection to create a table `questions`.
- Fill the `countries` table with the name of the country, latitude and longitude.
- Fill the `questions` table with different questions about this country.s

## Run script locally

To run the script locally please run `npm i` to install all the packages.

Then you can run `touch .env` in the root folder of this project to create the environment variable.

After that please enter the following information in the `.env` file:

```
DB_HOST="<YOUR_HOST>" // Proberly 127.0.0.1
DB_USERNAME="<YOUR_USERNAME>"
DB_PASSWORD="<YOUR_PASSWORD>"
DATABASE="<YOUR_DATABASE>"
```

If your env file is configured correctly, you should be able to run `npm run start`.
