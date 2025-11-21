# Setting up PostgreSQL and pgAdmin for CareerMate

## Prerequisites

1. **Docker Desktop**: Install Docker Desktop for Windows from https://www.docker.com/products/docker-desktop
   - Make sure to enable WSL 2 backend during installation if you have WSL 2 installed
   - Restart your system after Docker installation

2. **Ensure Docker is running**:
   - Check that Docker Desktop is running (you should see the Docker whale icon in the system tray)
   - Verify with command: `docker --version` and `docker-compose --version`

## Starting the Database and pgAdmin

### Option 1: Using Docker Compose (Recommended)

1. Open a command prompt or PowerShell as Administrator
2. Navigate to your project directory: `cd E:\babeo\diplom-careermate`
3. Run the following command to start PostgreSQL and pgAdmin:

```bash
docker-compose -f devops/docker/docker-compose.dev.yml --profile dev up -d postgres pgadmin
```

OR if you want to start all development services:

```bash
docker-compose -f devops/docker/docker-compose.dev.yml --profile dev up -d
```

### Option 2: Using the root docker-compose.yml symlink

1. From the project root directory:

```bash
docker-compose --profile dev up -d postgres pgadmin
```

## Database Connection Details

### PostgreSQL Connection Details:
- Host: `localhost`
- Port: `5432` (or as defined in your .env file as POSTGRES_PORT)
- Database: `careermate_dev`
- Username: `careermate`
- Password: `careermate_dev_pass` (or as defined in your .env file as POSTGRES_PASSWORD)

### Environment Variables:
The database is configured with values from your `.env` file:
- POSTGRES_USER=careermate
- POSTGRES_PASSWORD=careermate_dev_pass
- POSTGRES_DB=careermate_dev
- POSTGRES_PORT=5432

## Accessing pgAdmin

1. Once the containers are running, open your web browser
2. Navigate to: `http://localhost:5050` (or the port specified in PGADMIN_PORT in your .env file)
3. Login with the credentials:
   - Email: `admin@careermate.com`
   - Password: `admin`

### Adding PostgreSQL Server in pgAdmin

1. In pgAdmin, right-click on "Servers" in the left panel
2. Select "Create" → "Server"
3. In the "General" tab, provide a name (e.g., "CareerMate Dev")
4. In the "Connection" tab, fill in:
   - Host name/address: `postgres` (if connecting from another container) or `localhost` (if connecting from host)
   - Port: `5432`
   - Username: `careermate`
   - Password: `careermate_dev_pass`
   - Database: `careermate_dev`

## Database Initialization

The database will be automatically initialized with the SQL script located at:
`E:\babeo\diplom-careermate\devops\docker\db\init.sql`

This script creates all necessary tables for the CareerMate application and populates them with sample data.

## Troubleshooting

### If Docker commands fail:
1. Make sure Docker Desktop is running
2. Try restarting Docker Desktop
3. Check Windows Services to ensure "Docker Desktop Service" is running

### If pgAdmin doesn't load in browser:
1. Check that the container is running: `docker ps`
2. Verify the port mapping: `docker port careermate-pgadmin`
3. Try a different browser or clear browser cache

### If PostgreSQL is not accessible:
1. Check if the postgres container is running: `docker ps | findstr postgres`
2. Check container logs: `docker logs careermate-postgres`
3. Verify the port is available: `netstat -an | findstr 5432`

### To stop the services:
```bash
docker-compose -f devops/docker/docker-compose.dev.yml down
```

### To stop all development services:
```bash
docker-compose -f devops/docker/docker-compose.dev.yml down
```

## Additional Notes

- The database data is persisted in a Docker volume named `postgres_data`
- The pgAdmin configuration is persisted in a Docker volume named `pgadmin_data`
- The initial database setup will run only on the first start of the container
- To reset the database, remove the postgres_data volume: `docker volume rm postgres_data`