
from setuptools import setup, find_packages

setup(
    name='pythonrpc_pyserver',
    version='0.0.2',
    description='Call python internal in nodejs. The python server side.',  
    url='https://github.com/repo-list-553108/pythonrpc/tree/main/pythonrpc-pyserver',
    author='ltaoist',
    author_email='ltaoist@163.com',
    keywords='JavaScript rpc',
    packages=find_packages(),
    install_requires=['flask']
)   