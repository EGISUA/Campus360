#!/usr/bin/env python

import cgi
import cgitb
import json
import hashlib
import os

cgitb.enable()

data = cgi.FieldStorage(keep_blank_values=1)

target_folder=os.path.join(os.path.dirname(__file__), 'shareConfigs/')
if not os.path.exists(target_folder):
    os.makedirs(target_folder)

shareData = data["shareData"].value
hash_object = hashlib.sha1(shareData)
index = hash_object.hexdigest()

filepath = target_folder + index + ".txt"
if not os.path.exists(filepath):
    file = open(filepath, 'w')
    file.write(shareData)
    file.close()

print "Content-Type: text/html\n"
print index
