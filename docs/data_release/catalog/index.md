# Photometric Catalog

<a class="detail-back-link" href="../index.html#photometric-catalog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"></path><path d="M7 12h12"></path></svg><span>Back to Data Release</span></a>

Multiband photometry, redshift estimates, and stellar-population measurements for COSMOS, EGS, GOODS-N, GOODS-S, and UDS.

<div class="team-access-card">
  <div class="team-access-card__copy">
    <strong>Photometric catalog downloads</strong>
    <p>Catalog files are currently available to approved JWST-SPRING team members. Sign in with GitHub to continue to the password-protected Synology download folder.</p>
  </div>
  <div class="team-access-card__actions">
    <span class="team-access-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>Private team only</span>
    <a class="team-access-button" data-team-product="catalog" href="https://jwst-spring-team.jwst-spring-team-access.workers.dev/team/catalog/">Private catalog downloads <span aria-hidden="true">→</span></a>
  </div>
</div>

<nav class="section-jump-nav section-jump-nav--four release-subnav" aria-label="Photometric catalog guide">
  <a class="section-jump-nav__item" href="#catalog-construction"><span>Construction</span></a>
  <a class="section-jump-nav__item" href="#redshifts"><span>Redshifts</span></a>
  <a class="section-jump-nav__item" href="#stellar-populations"><span>Stellar populations</span></a>
  <a class="section-jump-nav__item" href="#column-guide"><span>Column guide</span></a>
</nav>

## Catalog Construction

Photometric catalogs were built independently for each field using [SExtractor (Bertin & Arnouts 1996)](https://doi.org/10.1051/aas:1996164). Available HST and JWST/NIRCam images were matched to the NIRCam F444W PSF. Sources were detected in a combined F356W+F444W image, and multiband fluxes were measured in dual-image mode using consistent apertures across the PSF-matched images. Because MIRI images have a broader PSF and more severe source blending, F770W photometry was primarily measured with [T-PHOT (Merlin et al. 2015)](https://doi.org/10.1051/0004-6361/201526471), using the higher-resolution NIRCam images as spatial priors.

Flux uncertainties combine Poisson noise with an empirical background contribution. For each band, 1000 random apertures were placed in source-free regions. The normalized median absolute deviation (nMAD) of the enclosed sky fluxes was measured as a function of aperture size to characterize background fluctuations, including correlated noise from resampling and PSF matching. The background uncertainty appropriate to each source aperture was then added in quadrature to its Poisson uncertainty.

These catalogs provide the photometry used for sample selection and SED fitting. Further details of their construction and validation will be presented in **Zhao et al. (2026, in preparation)**.

## Redshifts

Photometric redshifts were estimated independently with [EAZY (Brammer et al. 2008)](https://arxiv.org/abs/0807.1533), [LePhare](https://www.cfht.hawaii.edu/~arnouts/LEPHARE/lephare.html), and [CIGALE (Boquien et al. 2019)](https://arxiv.org/abs/1811.03094). The EAZY fits used the `tweak_fsps_QSF_12_v3` template set, based on modified FSPS models with a Kroupa IMF. LePhare followed the configuration of Shuntov et al. (2025). CIGALE used Bruzual & Charlot (2003) stellar populations with a Chabrier IMF and delayed-τ star formation histories, with 30 ≤ τ ≤ 10,000 Myr, 0.008 ≤ Z ≤ 0.05, −4 ≤ log U ≤ −2, and 0 ≤ E(B−V) ≤ 1.5 mag.

Spectroscopic measurements were compiled from literature catalogs and public spectroscopy, including the DAWN JWST Archive. They were matched to the photometric catalogs within **0.3 arcsec**. Where multiple measurements were available, a preferred redshift was selected using the reported quality and reliability flags.

The fiducial redshift, `zbest`, is the adopted spectroscopic redshift when one is available; otherwise, it is the median of the EAZY, LePhare, and CIGALE photometric estimates. In the released catalogs, a positive `zspec` identifies sources with an adopted spectroscopic redshift.

## Stellar Populations

Stellar-population fits were performed at fixed `zbest` using both [FAST (Kriek et al. 2009)](https://arxiv.org/abs/0905.1692) and CIGALE, each with exponentially declining and delayed-τ star formation histories. The CIGALE fits retained the stellar-population, metallicity, nebular-emission, and attenuation setup described above. FAST used Bruzual & Charlot (2003) models, a Chabrier IMF, and the Calzetti et al. (2000) attenuation law.

The recommended stellar mass, `lmass_med`, is the median of the four mass estimates from the two codes and two star formation histories. Similarly, `Av_med` is the median V-band attenuation from those four fits. These combined estimates reduce sensitivity to any single fitting code or star formation history.

## Column Guide

Column names are case-sensitive. Available filters differ between fields; the photometry table below describes the supplied example schema, while other filters follow the same `fluxF...` / `fluxerrF...` naming convention. Check the header of the downloaded field catalog for its actual columns.

**Missing values are stored as `-99`** and must be excluded before calculations or summary statistics. Other non-positive fluxes are not automatically missing values; an AB magnitude can only be calculated for a positive flux.

### Identifiers and Redshifts

| Column | Description | Unit |
|:-------|:------------|:-----|
| `ID` | Source identifier within the field catalog; use the field name together with the ID when combining catalogs. | — |
| `zbest` | Adopted redshift: preferred `zspec` when available, otherwise the median photometric estimate. | — |
| `zphot` | Median of the photometric-redshift estimates from EAZY, LePhare, and CIGALE. | — |
| `zspec` | Adopted spectroscopic redshift; a value greater than zero indicates an available spectroscopic measurement. | — |
| `z_eazy` | Photometric-redshift estimate from EAZY. | — |
| `z_lephare` | Photometric-redshift estimate from LePhare. | — |
| `z_cigale` | Photometric-redshift estimate from CIGALE. | — |

### Positions, Shapes, and Extraction Flags

Positions and shapes follow the [SExtractor parameter conventions](https://astromatic.github.io/sextractor/Param.html) and [moment-based definitions](https://astromatic.github.io/sextractor/Position.html). Image coordinates refer to the detection-image grid, with the first pixel center at (1, 1); they should not be applied directly to a differently sampled or reprojected image.

| Column | Description | Unit |
|:-------|:------------|:-----|
| `KRON_RADIUS` | Kron aperture scale in units of `A_IMAGE` and `B_IMAGE`. SExtractor includes the scale factor set by `PHOT_AUTOPARAMS`; this is not a radius in pixels. | — |
| `X_IMAGE` | Source centroid along the image x axis. | pixel |
| `Y_IMAGE` | Source centroid along the image y axis. | pixel |
| `X_WORLD` | Right ascension of the source centroid in the image WCS. | degree |
| `Y_WORLD` | Declination of the source centroid in the image WCS. | degree |
| `A_IMAGE` | Major-axis rms extent derived from the second moments of the source profile. | pixel |
| `B_IMAGE` | Minor-axis rms extent derived from the second moments of the source profile. | pixel |
| `THETA_IMAGE` | Major-axis angle measured from image +x toward image +y; this is an image-coordinate angle. | degree |
| `ELLIPTICITY` | Ellipticity, defined as 1 − `B_IMAGE` / `A_IMAGE`. | — |
| `FLAGS` | SExtractor extraction bitmask; several warnings may be combined in one value. | integer |
| `CLASS_STAR` | Stellarity index: values near 0 favor an extended profile; values near 1 favor a point-like profile. | 0–1 |

`A_IMAGE` and `B_IMAGE` are rms shape measures, not half-light radii. The [SExtractor Kron aperture definition](https://astromatic.github.io/sextractor/Photom.html) uses semi-axes `KRON_RADIUS × A_IMAGE` and `KRON_RADIUS × B_IMAGE`, subject to the configured minimum aperture. Do not apply the `PHOT_AUTOPARAMS` scale factor a second time.

The [extraction flags](https://astromatic.github.io/sextractor/Flagging.html) are additive bit values:

| Bit value | Meaning |
|:----------|:--------|
| 1 | A nearby bright object or bad pixels may affect the photometry. |
| 2 | The source was deblended. |
| 4 | At least one source pixel is saturated. |
| 8 | The source is truncated at an image boundary. |
| 16 | The aperture data are incomplete or corrupted. |
| 32 | The isophotal data are incomplete or corrupted. |
| 64 | A memory overflow occurred during deblending. |
| 128 | A memory overflow occurred during extraction. |

`FLAGS = 0` means none of these extraction warnings was raised; it does not guarantee that all measurements are scientifically reliable.

### Observed Photometry

Flux densities and their uncertainties use the **µJy scale (AB zero point 23.9)**. For a positive flux density:

<p class="catalog-equation">m<sub>AB</sub> = 23.9 − 2.5 log<sub>10</sub>(f<sub>ν</sub> / µJy)</p>

Each `fluxerrF...` column is the uncertainty associated with the corresponding `fluxF...` measurement. Its construction includes the empirical background and Poisson contributions described above.

| Flux column | Uncertainty column | Filter / instrument |
|:------------|:-------------------|:--------------------|
| `fluxF606W` | `fluxerrF606W` | F606W / HST |
| `fluxF814W` | `fluxerrF814W` | F814W / HST |
| `fluxF090W` | `fluxerrF090W` | F090W / NIRCam |
| `fluxF115W` | `fluxerrF115W` | F115W / NIRCam |
| `fluxF150W` | `fluxerrF150W` | F150W / NIRCam |
| `fluxF200W` | `fluxerrF200W` | F200W / NIRCam |
| `fluxF277W` | `fluxerrF277W` | F277W / NIRCam |
| `fluxF356W` | `fluxerrF356W` | F356W / NIRCam |
| `fluxF410M` | `fluxerrF410M` | F410M / NIRCam |
| `fluxF444W` | `fluxerrF444W` | F444W / NIRCam |
| `fluxF770W` | `fluxerrF770W` | F770W / MIRI |
| `fluxF1000W` | `fluxerrF1000W` | F1000W / MIRI |
| `fluxF1500W` | `fluxerrF1500W` | F1500W / MIRI |
| `fluxF1800W` | `fluxerrF1800W` | F1800W / MIRI |
| `fluxF2100W` | `fluxerrF2100W` | F2100W / MIRI |

### Rest-frame Absolute Magnitudes

These columns contain **rest-frame AB absolute magnitudes**, rather than apparent magnitudes, fluxes, or luminosities.

| Column | Rest-frame band | Unit |
|:-------|:----------------|:-----|
| `rest1600` | Ultraviolet at 1600 Å. | AB mag |
| `rest2800` | Ultraviolet at 2800 Å. | AB mag |
| `restUXbessel` | Bessell U band, retaining the catalog's `UXbessel` filter label. | AB mag |
| `restVbessel` | Bessell V band. | AB mag |
| `restIbessel` | Bessell I band. | AB mag |
| `restJpalomar` | Palomar J band. | AB mag |

### SED-fitting Parameters

In the column names, `fast` and `cigale` identify the fitting code; `exp` denotes an exponentially declining star formation history and `del` denotes a delayed-τ history. The catalog stores masses and star formation rates as base-10 logarithms:

- `lmass...`: log<sub>10</sub>(M<sub>★</sub> / M<sub>☉</sub>).
- `lsfr...`: log<sub>10</sub>[SFR / (M<sub>☉</sub> yr<sup>−1</sup>)].
- `Av...`: V-band dust attenuation A<sub>V</sub>, in magnitudes.

| Column | Description | Unit / scale |
|:-------|:------------|:-------------|
| `lmass_fast_exp` | Stellar mass from FAST with an exponentially declining SFH. | log mass |
| `Av_fast_exp` | V-band attenuation from FAST with an exponentially declining SFH. | mag |
| `lsfr_fast_exp` | Star formation rate from FAST with an exponentially declining SFH. | log SFR |
| `lmass_fast_del` | Stellar mass from FAST with a delayed-τ SFH. | log mass |
| `Av_fast_del` | V-band attenuation from FAST with a delayed-τ SFH. | mag |
| `lsfr_fast_del` | Star formation rate from FAST with a delayed-τ SFH. | log SFR |
| `lmass_cigale_exp` | Stellar mass from CIGALE with an exponentially declining SFH. | log mass |
| `Av_cigale_exp` | V-band attenuation from CIGALE with an exponentially declining SFH. | mag |
| `lsfr_cigale_exp` | Model star formation rate from CIGALE with an exponentially declining SFH. | log SFR |
| `lsfr100Myrs_cigale_exp` | Mean SFR over the last 100 Myr from CIGALE with an exponentially declining SFH. | log SFR |
| `lsfr10Myrs_cigale_exp` | Mean SFR over the last 10 Myr from CIGALE with an exponentially declining SFH. | log SFR |
| `lmass_cigale_del` | Stellar mass from CIGALE with a delayed-τ SFH. | log mass |
| `Av_cigale_del` | V-band attenuation from CIGALE with a delayed-τ SFH. | mag |
| `lsfr_cigale_del` | Model star formation rate from CIGALE with a delayed-τ SFH. | log SFR |
| `lsfr100Myrs_cigale_del` | Mean SFR over the last 100 Myr from CIGALE with a delayed-τ SFH. | log SFR |
| `lsfr10Myrs_cigale_del` | Mean SFR over the last 10 Myr from CIGALE with a delayed-τ SFH. | log SFR |
| `lmass_med` | Recommended stellar mass: median of the four FAST/CIGALE × exp/del estimates. | log mass |
| `Av_med` | Median V-band attenuation from the same four fits. | mag |
