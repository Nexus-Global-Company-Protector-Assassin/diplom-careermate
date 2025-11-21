# Accessing pgAdmin for CareerMate Database

## Accessing the pgAdmin Interface

Once you have started the Docker containers as described in the DOCKER_SETUP.md file, you can access pgAdmin using the following steps:

### 1. Verify Services are Running
First, make sure the containers are running:
```bash
docker ps
```
You should see containers with names like:
- `careermate-postgres`
- `careermate-pgadmin`

### 2. Access pgAdmin Web Interface
1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Navigate to: `http://localhost:5050`
   - Note: The port may be different if you changed `PGADMIN_PORT` in your `.env` file
   - Default port is 5050 as specified by `PGADMIN_PORT=5050` in your .env file

### 3. Login to pgAdmin
- Email/Username: `admin@careermate.com`
- Password: `admin`
  - Note: This password is defined in your `.env` file as `PGADMIN_PASSWORD=admin`

## Adding the CareerMate Database Server

Once logged in to pgAdmin:

### 1. Create a New Server Connection
1. In the left panel, right-click on "Servers"
2. Select "Create" → "Server..."

### 2. Configure the Connection
In the dialog that appears:

**General Tab:**
- Name: Enter any name (e.g., "CareerMate Development")

**Connection Tab:**
- Host name/address: `host.docker.internal` (this allows pgAdmin container to connect to the host machine)
  - OR if using Docker Desktop with WSL 2: Use the WSL host IP (typically `172.17.0.1`)
  - OR if both services are in the same Docker network, use `careermate-postgres`
- Port: `5432` (or your custom POSTGRES_PORT value)
- Maintenance database: `careermate_dev`
- Username: `careermate`
- Password: `careermate_dev_pass`
  - Note: This password is defined in your `.env` file as `POSTGRES_PASSWORD=careermate_dev_pass`

Click "Save" to create the connection.

## Connecting to the CareerMate Database

After successfully adding the server:
1. Expand the server connection in the left panel
2. Expand "Databases"
3. Double-click on "careermate_dev" to connect
4. You can now explore tables, run queries, and manage the database

## Useful pgAdmin Features for CareerMate Development

### 1. Query Tool
- Right-click on the "careermate_dev" database
- Select "Query Tool" to run SQL commands
- Try: `SELECT * FROM users;` to see the initial data

### 2. Creating New Tables
- Right-click on the database
- Select "Create" → "Table" to create new tables

### 3. Managing Data
- Right-click on any table
- Select "View/Edit Data" → "All Rows" to see and modify table contents

### 4. Backup and Restore
- Right-click on the database
- Select "Backup" to create a backup
- Use "Restore" to restore from a backup file

## Pre-populated Data

The database has been initialized with the following tables and sample data:
- `users` - Contains user information with an admin user (admin@careermate.com)
- `profiles` - User profile information
- `job_applications` - Sample job applications
- `companies` - Sample companies
- `jobs` - Sample job listings
- `skills` - Predefined skills
- `user_skills` - Skills associated with users
- `job_skills` - Skills required for jobs

## Troubleshooting Common Issues

### Cannot connect to PostgreSQL server
1. Verify that the PostgreSQL container is running:
   ```bash
   docker ps | findstr postgres
   ```
2. Check the PostgreSQL logs:
   ```bash
   docker logs careermate-postgres
   ```
3. Ensure the port 5432 is not used by another application

### pgAdmin interface not loading
1. Check if the pgadmin container is running:
   ```bash
   docker ps | findstr pgadmin
   ```
2. Try accessing on a different port by modifying PGADMIN_PORT in .env
3. Clear browser cache or try an incognito/private window

### Connection authentication failed
1. Verify your credentials match those in your `.env` file
2. The default PostgreSQL user is `careermate` with password `careermate_dev_pass`

### Server connection fails
1. Try using `host.docker.internal` as the host name
2. Or try using the IP address of your Docker bridge network:
   ```bash
   docker network inspect devops_careermate-network
   ```
3. Ensure both containers are on the same Docker network

## Stopping and Restarting Services

### To stop the services:
```bash
docker-compose -f devops/docker/docker-compose.dev.yml down
```

### To restart the services:
```bash
docker-compose -f devops/docker/docker-compose.dev.yml --profile dev up -d postgres pgadmin
```

For more detailed instructions, refer to the DOCKER_SETUP.md file in the project root directory.