class UnexpectedResponseError extends Error {

    constructor(payload) {

        super("The response from the API was unepxected and could not be handled.")

        this.payload = payload
        this.name = this.constructor.name;
    }

}

export default UnexpectedResponseError