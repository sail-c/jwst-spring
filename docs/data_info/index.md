# Data Information

- `*drz.fits` Science image

- `*wht.fits` Weight image

- `*exp.fits` Exposure image

- `star_region_*.fits` Mask image containing overexposed stars and persistence

- `*segmentation.fits` Segmentation image obtained from detecting multi-band stacked images

- `*final_segmentation.fits` The final segmentation image obtained after a series of processing steps (including deblending, star and persistence masking, artifact removal, etc.), corresponding to the photometric star catalog

- `*photometry.txt` Multi-band photometric catalog

NIRCAM provides images with a scale of 0.03''/pixel, while MIRI provides images with scales of 0.03''/pixel and 0.09''/pixel (indicated in the file names as 30mas and 90mas, respectively).