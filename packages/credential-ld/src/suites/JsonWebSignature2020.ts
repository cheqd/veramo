import { CredentialPayload, DIDDocument, IAgentContext, IKey, TKeyType } from "@veramo/core";
import { RequiredAgentMethods, VeramoLdSignature } from "../ld-suites";
import * as u8a from "uint8arrays";
import { JsonWebKey, JsonWebSignature } from "@transmute/json-web-signature";
import { base64ToBytes } from "@veramo/utils";


/**
 * Veramo wrapper for the JsonWebSignature2020 suite by Transmute Industries
 * 
 * @alpha This API is experimental and is very likely to change or disappear in future releases without notice.
 */
export class VeramoJsonWebSignature2020 extends VeramoLdSignature {
    getSupportedVerificationType(): 'JsonWebKey2020' {
        return 'JsonWebKey2020'
    }
    
    getSupportedVeramoKeyType(): TKeyType {
        return 'Ed25519'
    }

    async getSuiteForSigning(
        key: IKey,
        issuerDid: string,
        verificationMethodId: string,
        context: IAgentContext<RequiredAgentMethods>,
    ): Promise<any> {
        const controller = issuerDid

        // DID Key ID
        let id = verificationMethodId

        const signer = {
            // returns a JWS detached
            sign: async (args: { data: Uint8Array }): Promise<Uint8Array> => {
                const messageString = u8a.toString(args.data, 'base64')
                const signature = await context.agent.keyManagerSign({
                    keyRef: key.kid,
                    algorithm: 'EdDSA',
                    data: messageString,
                    encoding: 'base64',
                })
                return base64ToBytes(signature)
            },
        }

        const verificationKey = await JsonWebKey.from({
            id: id,
            type: this.getSupportedVerificationType(),
            controller: controller,
            publicKeyJwk: {
                kty: 'OKP',
                crv: 'Ed25519',
                x: u8a.toString(u8a.fromString(key.publicKeyHex, 'hex'), 'base64url'),
            },
        })

        verificationKey.signer = signer

        return new JsonWebSignature({
            key: verificationKey,
        })
    }

    getSuiteForVerification(): any {
        return new JsonWebSignature()
    }

    preSigningCredModification(credential: CredentialPayload): void {
        // do nothing
    }

    preDidResolutionModification(didUrl: string, didDoc: DIDDocument): void {
        // do nothing
    }
}