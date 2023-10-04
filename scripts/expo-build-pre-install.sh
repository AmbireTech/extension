#!/usr/bin/env bash

# EAS build lifecycle hook executed before EAS Build runs npm (yarn) install

mkdir -p ~/.ssh

# Decode the base64 private key directly from the environment variable and generate the public key
echo "$AMBIRE_COMMON_SSH_DEPLOY_KEY_BASE64" | base64 --decode > ~/.ssh/id_rsa

chmod 0600 ~/.ssh/id_rsa
ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub

# Add GitHub to the list of known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts
