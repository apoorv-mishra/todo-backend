# todo-backend

### Usage
1. `git clone https://github.com/apoorv-mishra/todo-backend.git`
2. `cd todo-backend && npm install`
3. `psql -h <host> -U <user> -d <databse> -f 'tables.sql'`(assuming postgresql server is running on port 5432)
4. `touch .env`
5. Add following env vars to `.env`,
```
DB_HOST=<host>
DB_USER=<user>
DB_PASS=<password>
DB_NAME=<database>
JWT_SECRET=<jwt-secret>
```   
(Tip: Generate jwt secret using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"`)

6. `npm start`
7. Hit http://localhost:8080, you should see the message "Welcome!"
