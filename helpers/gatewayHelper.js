import braintree from 'braintree';
import dotenv from 'dotenv';

dotenv.config();

//payment gateway
// creates a gateway object to be used in other parts of the code
// need to be exported here to ensure that we can mock it
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export { gateway };
