#!/usr/bin/env python
#Import all the necessary modules
print "Content-type:text/html\r\n\r\n"
import cgi, os, sys, traceback
import cgitb
import urllib
import urllib2,io
from datetime import datetime

from contextlib import closing

#Sending Email to PDC
cgitb.enable()
import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEBase import MIMEBase
from email.MIMEText import MIMEText
from email.Utils import COMMASPACE, formatdate
from email import Encoders

#Look at the code where this function is being called if you want to modify the From/To address
#This uses UA SMTP Server to send off the email with the zipped contents in the attachment
def send_mail(send_from, send_to, subject, text, server="localhost"):
    assert type(send_to)==list

    msg = MIMEMultipart()
    msg['From'] = send_from
    msg['To'] = COMMASPACE.join(send_to)
    msg['Date'] = formatdate(localtime=True)
    msg['Subject'] = subject

    msg.attach(MIMEText(text))

    smtp = smtplib.SMTP('smtpgate.email.arizona.edu') #smtp.gmail.com:587
    smtp.starttls()
    smtp.sendmail(send_from, send_to, msg.as_string()) #Sending the email using SMTP server
    smtp.close()


try: # Windows needs stdio set for binary mode.
    import msvcrt
    msvcrt.setmode (0, os.O_BINARY) # stdin  = 0
    msvcrt.setmode (1, os.O_BINARY) # stdout = 1
except ImportError:
    pass

#Retrieving all the form values using Python CGI module
form = cgi.FieldStorage(keep_blank_values=1)

if "errorMessage" in form:

    #Write the feedback content to text file
    error_message=form["errorMessage"].value

    try:
        #Send email notice
        send_mail('pdc-egis@email.arizona.edu',['pdc-egis@email.arizona.edu'],'EGIS Error','The following error was detected:\n\n' + error_message)
    except:
        pass

print "done"