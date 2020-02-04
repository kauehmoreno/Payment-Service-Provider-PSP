export const validatorErrCode = 400
export type Validators<T> = (v: T) => ValidateError | null

export interface ValidateError extends Error{
    code:number
}

export const validateCustomError = (err:Error): ValidateError => {
    return {
        message:err.message,
        stack:err.stack,
        name:err.name,
        code:validatorErrCode
    }
}
