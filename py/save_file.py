#!/usr/bin/env python
#Import all the necessary modules
print "Content-type:text/html\r\n\r\n"
import cgi, os
import cgitb
import urllib
import urllib2,io,zipfile
from datetime import datetime
#import shapefile
import json

from contextlib import closing
from zipfile import ZipFile, ZIP_DEFLATED

message=""

#Zip the feedback contents and save them to the server using the relative path
def zipdir(basedir, archivename):
    assert os.path.isdir(basedir)

    with closing(ZipFile(archivename, "w", ZIP_DEFLATED)) as z:
        for root, dirs, files in os.walk(basedir):
            #NOTE: ignore empty directories
            for fn in files:
                absfn = os.path.join(root, fn)

                zfn = absfn[len(basedir)+len(os.sep)-1:] #XXX: relative path

                z.write(absfn, zfn)


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
def send_mail(send_from, send_to, subject, text, files=[], server="localhost"):
    assert type(send_to)==list
    assert type(files)==list

    msg = MIMEMultipart()
    msg['From'] = send_from
    msg['To'] = COMMASPACE.join(send_to)
    msg['Date'] = formatdate(localtime=True)
    msg['Subject'] = subject

    msg.attach(MIMEText(text))

    for f in files:
        part = MIMEBase('application', 'zip')
        with open (f,'rb') as f_url:
            part.set_payload(f_url.read())
            Encoders.encode_base64(part)
            part.add_header('Content-Disposition', 'attachment; filename="%s"' % os.path.basename(f))
            msg.attach(part) #Attaching the zip file to the email message
        
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

#This will create a new folder (using relative path) first to store the contents on web server
todays_date=datetime.strftime(datetime.now(),"%m_%d_%y")
dt=datetime.strftime(datetime.now(),"%m%d%y_%H%M%S%f")
target_folder='/Upload_files/files_'+todays_date
sub_folder=target_folder+"/"+dt
if not os.path.exists(target_folder):
    os.makedirs(target_folder)
if not os.path.exists(sub_folder):
    os.makedirs(sub_folder)

#file is the HTML ID of the form, where users upload an image showing the issue
fileitem = form["file"]

#Test if the file was uploaded
if fileitem.filename:

   #strip leading path from file name to avoid directory traversal attacks
   fn = os.path.basename(fileitem.filename)
   with open(sub_folder +"/"+ fn, 'wb') as f:
    f.write(fileitem.file.read()) #Write the file to the web server
    message = 'The attachment file ' + fn + ' was uploaded successfully\n'

else:
   message = "There wasn't any attachments \n"


#Write the graphic geometry to text file in JSON format
geometry=form["geometry"].value
with open(sub_folder+"/geometry.json", "w") as f:
    f.write(geometry)
    message+='The file geometry.txt was uploaded successfully\n'


#Upload the Screen Capture image to server. This image is obtained as a result of print task that is executed just before the python script is called
url=form["Print_Image"].value
with open(sub_folder+'/screencapture.png', "wb") as f:
    #fname = newpath+"\testing.png"
    #urllib.urlretrieve( url, f )
    f.write(urllib.urlopen(url).read()) #Once the print is complete, the output URL contains the image, which is being directly saved to the web server
    f.close()
    message+='The file '+sub_folder+'/screencapture.png'+' was uploaded successfully\n'


#Write the feedback content to text file
feedback_content=form["feedback"].value
with open(sub_folder+'/feedback.txt','w') as f:
    f.write(feedback_content)
    message+='The file feedback.txt was uploaded successfully\n'


try:
    #Write all the folder contents to a zip file
    zipdir(sub_folder,'/Upload_files/Feedback_'+dt+'.zip')
    message+='Zipped the feedback contents\n'

    #Send the zip file as an attachment
    send_mail('pdc-egis@email.arizona.edu',['pdc-egis@email.arizona.edu'],'Feedback_EGIS','Feedback from Enterprise Responsive GIS Web Map',['/Upload_files/Feedback_'+dt+'.zip'])
    message+="Successfully email'ed the feedback to PDC..!!\n"

    #Delete the contents from web server
    #http://docs.python.org/2/library/os.html#os.walk
    for root, dirs, files in os.walk('/Upload_files',topdown=False):
        for name in files:
            os.remove(os.path.join(root,name))
        for name in dirs:
            os.rmdir(os.path.join(root,name))
            
except:
    message+='Issues in zipping or sending the feedback contents in email\n'


print message

#Converting Json file to Shapefile using Shapefile.py library
#http://paulcrickard.wordpress.com/2013/01/31/json-to-shapefile/
#https://code.google.com/p/pyshp/
'''with open(sub_folder+"/geometry.json") as json_data:
    data = json.load(json_data)
    w=shapefile.Writer(shapefile.POLYGON)
    i=0
    while (i < len(data["geometry"])):
'''

'''
#Write user info to text file
user_name=form["name"].value
user_email=form["email"].value

with open('files/user_info.txt','w') as f:
    f.write(user_name+"\n"+user_email)
    message+='The file user_info.txt was uploaded successfully\n'

#Write log file with the status of upload
with open ('files/log.txt','w') as f:
    f.write(message)
'''

#imgfile=form["Print_Output"]
#message=imgfile.upper()
'''print """\
Content-Type: text/html\n
<html><body>
<p></p>
</body></html>
#""" 
'''
#print 'Location: http://localhost/EnterpriseMobile/\n'
#print 'success'

#print "Content-Type: text/html"
