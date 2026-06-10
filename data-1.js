window.INTERVIEW_DATA = (window.INTERVIEW_DATA || []).concat([
  {
    "id": "sql-oltp",
    "category": "SQL",
    "subcategory": "OLTP",
    "title": "What is OLTP?",
    "keywords": ["oltp","transactions","operational systems","concurrency"],
    "short": "OLTP systems process many small, real-time business transactions such as orders, payments, inventory updates, and customer changes.",
    "answer": "OLTP stands for Online Transaction Processing. It describes systems that support day-to-day business activity in real time.\n\nTypical characteristics:\n- Many short INSERT, UPDATE, DELETE, and SELECT operations\n- Many concurrent users\n- Strong data integrity requirements\n- Fast response times\n- Normalized schemas\n- Transactions that either fully succeed or fully fail\n\nExamples include order entry, payment processing, inventory updates, reservations, and customer account changes.\n\nA good interview phrase:\n“OLTP is about safely and quickly processing live operational transactions while preserving consistency under concurrent use.”"
  },
  {
    "id": "sql-transaction",
    "category": "SQL",
    "subcategory": "Transactions",
    "title": "What is a transaction?",
    "keywords": ["transaction","atomicity","unit of work","acid"],
    "short": "A transaction groups multiple database operations into one logical unit of work.",
    "answer": "A transaction is a group of database operations treated as one unit.\n\nFor example, placing an order may:\n1. Insert the order\n2. Insert order lines\n3. Reduce inventory\n4. Record payment status\n\nAll steps should succeed together. If one fails, the database should return to its prior state.\n\nTransactions support ACID:\n- Atomicity: all or nothing\n- Consistency: rules remain valid\n- Isolation: concurrent work does not corrupt results\n- Durability: committed changes survive failure"
  },
  {
    "id": "sql-commit",
    "category": "SQL",
    "subcategory": "Transactions",
    "title": "What does COMMIT do?",
    "keywords": ["commit","save transaction","durability"],
    "short": "COMMIT permanently saves all changes made in the current transaction.",
    "answer": "COMMIT makes the transaction's changes permanent.\n\nBefore COMMIT, the work is still part of an open transaction and may be rolled back. After COMMIT, the database treats the changes as completed.\n\nExample:\nBEGIN TRANSACTION;\nUPDATE Inventory SET Quantity = Quantity - 1 WHERE ProductId = 10;\nCOMMIT;\n\nIn business terms: the order succeeded, so the inventory change becomes official."
  },
  {
    "id": "sql-rollback",
    "category": "SQL",
    "subcategory": "Transactions",
    "title": "What does ROLLBACK do?",
    "keywords": ["rollback","undo","error handling","transaction failure"],
    "short": "ROLLBACK undoes changes made in the current transaction.",
    "answer": "ROLLBACK reverses all uncommitted changes in the current transaction.\n\nIt is used when a step fails or a validation rule is not met.\n\nExample:\nBEGIN TRANSACTION;\nUPDATE Inventory SET Quantity = Quantity - 1 WHERE ProductId = 10;\n-- payment fails\nROLLBACK;\n\nThe inventory returns to its original value, preventing a partially completed order."
  },
  {
    "id": "sql-locking",
    "category": "SQL",
    "subcategory": "Concurrency",
    "title": "What is locking?",
    "keywords": ["locking","blocking","concurrency","row lock","page lock"],
    "short": "Locking prevents concurrent operations from interfering with the same data.",
    "answer": "Locking is how SQL Server protects data while transactions read or modify it.\n\nLocks may apply to rows, keys, pages, or tables. A transaction may hold a lock while it completes, causing another transaction to wait.\n\nLocking preserves correctness, but excessive or long-running locks can cause blocking and poor performance.\n\nUseful phrase:\n“Locking is necessary for consistency, but transactions should be kept short and queries well-indexed to minimize blocking.”"
  },
  {
    "id": "sql-deadlock",
    "category": "SQL",
    "subcategory": "Concurrency",
    "title": "What is a deadlock?",
    "keywords": ["deadlock","deadlock victim","blocking","lock order"],
    "short": "A deadlock occurs when two transactions wait on resources held by each other.",
    "answer": "A deadlock occurs when two transactions form a circular wait.\n\nExample:\n- Transaction A locks Customer, then waits for Order.\n- Transaction B locks Order, then waits for Customer.\n\nNeither can continue. SQL Server detects the cycle and terminates one transaction as the deadlock victim.\n\nWays to reduce deadlocks:\n- Access tables in a consistent order\n- Keep transactions short\n- Add appropriate indexes\n- Avoid unnecessary user interaction inside transactions\n- Retry failed transactions when appropriate"
  },
  {
    "id": "sql-index",
    "category": "SQL",
    "subcategory": "Performance",
    "title": "What is an index?",
    "keywords": ["index","seek","scan","clustered","nonclustered"],
    "short": "An index is a data structure that helps SQL Server find rows faster.",
    "answer": "An index is similar to an index in a book: it helps SQL Server locate rows without scanning the entire table.\n\nBenefits:\n- Faster filtering\n- Faster joins\n- Faster sorting in some cases\n\nCosts:\n- Additional storage\n- Slower INSERT, UPDATE, and DELETE operations\n- Maintenance overhead\n\nCommon types:\n- Clustered index: determines the physical order of table data\n- Nonclustered index: separate lookup structure that points to rows\n\nA useful interview point:\n“Indexes should support actual query patterns; too few cause scans, while too many hurt write-heavy OLTP workloads.”"
  },
  {
    "id": "sql-primary-key",
    "category": "SQL",
    "subcategory": "Data Modeling",
    "title": "What is a primary key?",
    "keywords": ["primary key","unique","not null","identity"],
    "short": "A primary key uniquely identifies each row in a table.",
    "answer": "A primary key is a column or set of columns that uniquely identifies each row.\n\nPrimary keys must be:\n- Unique\n- Not NULL\n- Stable enough to serve as the row identifier\n\nExample:\nCustomers(CustomerId, Name, Email)\n\nCustomerId is typically the primary key. SQL Server often implements it with a unique index."
  },
  {
    "id": "sql-foreign-key",
    "category": "SQL",
    "subcategory": "Data Modeling",
    "title": "What is a foreign key?",
    "keywords": ["foreign key","referential integrity","parent child","relationship"],
    "short": "A foreign key links a child table to a valid row in a parent table.",
    "answer": "A foreign key enforces a relationship between tables.\n\nExample:\nOrders.CustomerId references Customers.CustomerId.\n\nThis prevents an order from referencing a customer that does not exist.\n\nBenefits:\n- Preserves referential integrity\n- Prevents orphan records\n- Makes table relationships explicit"
  },
  {
    "id": "sql-normalization",
    "category": "SQL",
    "subcategory": "Data Modeling",
    "title": "What is normalization?",
    "keywords": ["normalization","1nf","2nf","3nf","duplication"],
    "short": "Normalization organizes data to reduce duplication and update anomalies.",
    "answer": "Normalization separates data into related tables so each fact is stored in the proper place.\n\nFor example, instead of repeating customer details on every order:\n- Customers stores customer data\n- Orders stores order headers\n- OrderLines stores products and quantities\n\nBenefits:\n- Less duplication\n- Cleaner updates\n- Better integrity\n\nTradeoff:\n- More joins may be required\n\nOLTP databases are commonly normalized because consistency matters more than minimizing joins."
  }
]);
