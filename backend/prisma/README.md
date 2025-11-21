# Prisma Database Setup

## Configuration

The database schema is defined in `schema.prisma` and includes all necessary models for the CareerMate application:

- User and Profile
- CareerPath
- Resume
- Job
- Application
- CoverLetter
- Company
- InterviewPreparation
- WeeklyReport
- ActivityLog

## Environment Variables

Make sure to set the `DATABASE_URL` in your `.env` file:

```
DATABASE_URL="postgresql://username:password@localhost:5432/careermate?schema=public"
```

## Migrations

To create and apply a new migration:

```bash
npx prisma migrate dev --name migration_name
```

To apply existing migrations to a production database:

```bash
npx prisma migrate deploy
```

To generate Prisma Client after schema changes:

```bash
npx prisma generate
```

## Database Commands

To open Prisma Studio (database browser):

```bash
npx prisma studio
```

To reset the database (development only):

```bash
npx prisma migrate reset
```

To seed the database:

```bash
npx prisma db seed
```

## Notes

- All models use UUID primary keys by default
- DateTime fields use `@default(now())` for creation timestamps
- Relationships are properly defined with onDelete behaviors
- Json fields are used for flexible data storage
- Decimal fields are used for precise numerical values like ratings