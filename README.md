# Video information Editor
This app allows adding ads information in video.
## How to run this app
This app UI is designed in python 3.7. This app can be worked in any python 3.x version.

This app is asking for installing the follow packages
- tkinter
- opencv-python
- pillow
- webbrowser
- moviepy

After all packages are installed, we can run app by the following.
>python app.py

### Python Virtual Environments

It is often useful to have one or more Python environments where we can experiment with different combinations of packages without affecting our main installation. Python supports this through virtual environments. The virtual environment is a copy of an existing version of Python with the option to inherit existing packages. A virtual environment is also useful when we need to work on a shared system and do not have permission to install packages as you will be able to install them in the virtual environment.
#### Install the virtualenv package
The virtualenv package is required to create virtual environments.
>pip install virtualenv
#### Create the virtual environment
>virtualenv env
#### Activate the virtual environment
>source env/bin/activate
### How to install package in python
To install any python package, open terminal (command prompt).

> pip install {package name}

If there is requirements.txt file, it is easy to install the needed packages by the following.

>pip install -r /path/to/requirements.txt
