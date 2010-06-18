[Pure Javascript Upload](http://www.codenothing.com/archives/2010/pure-javascript-upload/)
========================

No flash, no page reload, all javascript (with some frame hacks). This upload function is a cross browser implementation that
uses native file upload when possible, while falling back to frame hacks in older browsers.


The Problem
-----------
For native upload to work, the browser has to have implemented the [FileReader API](http://www.w3.org/TR/file-upload/) and support
the [sendAsBinary](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()) method of an 
[XHR Request Object](http://www.w3.org/TR/XMLHttpRequest/).  
  
Currently, only Firefox 3.6+ has successfully implemented the above. The latest Webkit(Chrome/Safari) support file upload, but only a single file
at a time as outlined by [Andrea Giammarchi](http://webreflection.blogspot.com/2009/03/safari-4-multiple-upload-with-progress.html). The rest
of the browsers have no support for file upload over an XHR Request.


The Solution
------------
There are 3 different ways to send files without refreshing the page, native upload using the FileReader API, single file upload using
the upload XHR Request, and submitting a form through an iframe. This script handles all 3, but with limitations. A normalize method was
extended onto the Upload constructor at an attempt to keep things consistent. What this does is force all browsers that don't have the 
FileReader API implemented to use the frame hack.  

You can enable file upload by calling the Upload.denormalize method, but this will cause inconsistency in the way file uploads are handled.
Mainly in that you can no longer send multiple files, and can only send data as GET parameters, instead of POST. Still, with it enabled, File
drag and drop from desktop will be supported.  

Bowser Support
--------------

**IE** 6, 7, 8  
**FireFox** 2.0.0.20, 3.0.17, 3.5.7, 3.6  
**Safari** 3.0.4, 3.1.2, 3.2.1, 4.0.5, 5.0  
**Opera** 9.52, 9.64, 10.01, 10.10  
**Chrome** 5.0  


Credits
--------
[Andrew Valums](http://valums.com/ajax-upload/) - Original Author

[Andrea Giammarchi](http://webreflection.blogspot.com/2009/03/safari-4-multiple-upload-with-progress.html) - Chrome/Safari Hack

[Corey Hart](http://www.codenothing.com) - Creator of this adaptation
