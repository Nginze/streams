/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { AnyZodObject, ZodError } from 'zod';

const validate = (
  schema: AnyZodObject,
) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
    //   body: req.body,
    //   query: req.query,
    //   params: req.params,
    });
    return next();
  } catch (e) {
    if (e instanceof ZodError) {
      throw createHttpError(400, e.message, 'Zod Schema');
    }
    return next();
  }
};

export default validate;