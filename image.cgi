#!/usr/bin/python

import urllib
import cgi

fs = cgi.FieldStorage()
url = fs['url'].value
urllib.urlretrieve(url, 'tmp.png')

print 'Content-type: image/png\n'
print file(r'tmp.png', 'rb').read()
