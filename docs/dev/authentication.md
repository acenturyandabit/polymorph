# Authentication

The objectives of authentication are to ensure that people who are able to access a document can do so, and people who do not have access cannot. There should also be read vs write permissions. 

To do this, we need:
- Identification of users/clients
- Authentication of users/clients
- Association between users and document-permissions.

Clients and users can be managed by the server, so we will refer to clients from now on.

The target user should be familiar with the regular sign up / login flows on existing websites such as Facebook. 

## Design
Authentication should be implemented at the `savesource` level. This is done to reduce the computational 
We want current and future `savesource`s to easily be able to integrate authentication. 

## User stories
### As someone with an existing document, I want to store this document on a server in a way such that only the server manager and myself can access it.
1. I open my document.
2. I create a new savesource and enter the server URL and a password.
3. I press 'Save to source'.
4. The server allocates room for the document; checking for document name conflicts. 
5. The server accepts the key and stores it locally in plaintext.
6. When the document is saved, the server compares the key sent and makes sure it is equal to the key saved locally. 
7. When the document is retrieved, the server compares the key sent and makes sure it is equal to the key saved locally.
#### Failure cases 
- The server is compromised
    - Solution: Encrypt the document so that the server cannot read it. This will not work with all save sources.
- The user's connection is intercepted and the key is retrieved.
    - Solution: Encrypt messages using public/private key encryption. This would be a cool TODO.
- Someone who knows the user's password spoofs the user.
    - No real solution to this.
