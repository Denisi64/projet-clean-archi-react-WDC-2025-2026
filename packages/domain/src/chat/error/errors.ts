export class DiscussionNotFound extends Error {
    constructor() {
        super('DiscussionNotFound');
    }
}

export class ForbiddenDiscussionAccess extends Error {
    constructor() {
        super('ForbiddenDiscussionAccess');
    }
}

export class DiscussionClosed extends Error {
    constructor() {
        super('DiscussionClosed');
    }
}

export class AlreadyAssigned extends Error {
    constructor() {
        super('DiscussionAlreadyAssigned');
    }
}
