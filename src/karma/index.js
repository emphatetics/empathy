class UserStats {
    constructor(id, karma) {
        this.id = id;
        this.karma = karma;
    }

    get id() {
        return this.id;
    }

    get karma() {
        return this.karma;
    }
}

// Load data from the database