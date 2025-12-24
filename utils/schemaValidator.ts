import Ajv from 'ajv';

const ajv = new Ajv();

export function validateSchema(schema: object, data: object) {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new Error(JSON.stringify(validate.errors, null, 2));
  }
}
