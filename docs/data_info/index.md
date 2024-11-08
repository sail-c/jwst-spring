# Data Information

- __*drz.fits__ Science image

- __*wht.fits__ Weight image

- __*exp.fits__ Exposure image

- __star\_region\_*.fits__ Mask image containing overexposed stars and persistence

- __*segmentation.fits__ Segmentation image obtained from detecting multi-band stacked images

- __*final_segmentation.fits__ The final segmentation image obtained after a series of processing steps (including deblending, star and persistence masking, artifact removal, etc.), corresponding to the photometric star catalog

- __*photometry.txt__ Multi-band photometric catalog

NIRCAM provides images with a scale of 0.03''/pixel, while MIRI provides images with scales of 0.03''/pixel and 0.09''/pixel (indicated in the file names as 30mas and 90mas, respectively).