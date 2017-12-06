#!/bin/bash

file=$1

scp -i tylerKey.pem $file ubuntu@ec2-18-220-113-226.us-east-2.compute.amazonaws.com:~/server/