
export class BadConfigError implements Error {
  public name: string = "BadConfigError";
  public message: string;

  constructor(message?: string) {
    this.message = message;

    var errMod: any = Error;
    errMod.captureStackTrace(this, BadConfigError);
  }
}

require('util').inherits(BadConfigError, Error);

export class NullArgumentError implements Error {
  public name: string = "NullArgumentError";
  public message: string;
  
  constructor(message?: string) {
    this.message = message;

    var errMod: any = Error;
    errMod.captureStackTrace(this, InvalidArgumentError);
  }


}

require('util').inherits(NullArgumentError, Error);

export class InvalidArgumentError implements Error {
  public name: string = "InvalidArgumentError";
  public message: string;

  constructor(message?: string) {
    this.message = message;

    var errMod: any = Error;
    errMod.captureStackTrace(this, InvalidArgumentError);
  }

}

require('util').inherits(InvalidArgumentError, Error);