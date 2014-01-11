export class NullArgumentError implements Error {
  public name: string = "NullArgumentError";
  public message: string;
  
  constructor(message?: string) {
    this.message = message;

  }
}

export class InvalidArgumentError implements Error {
  public name: string = "InvalidArgumentError";
  public message: string;

}