#!/usr/bin/env bash

# EAS build lifecycle hook executed before EAS Build runs npm (yarn) install

mkdir -p ~/.ssh

# Restore the private key from the base64 encoded file and generate the public key
cat "$AMBIRE_COMMON_SSH_DEPLOY_KEY_BASE64" | base64 -d > ~/.ssh/id_rsa
chmod 0600 ~/.ssh/id_rsa
ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub

# Add GitHub to the list of known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts
