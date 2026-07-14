<?php defined('ALTUMCODE') || die() ?>

<?php if(($data->type ?? 'fontawesome') == 'fontawesome'): ?>
    <button type="button" class="<?= $data->class ?> d-none" style="color: #3a18f2;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), l('global.device')) ?>" data-native-share>
        <i class="fas fa-fw fa-share"></i>
    </button>

    <a href="mailto:?body=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" style="color: #3b5998;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), 'Email') ?>">
        <i class="fas fa-fw fa-envelope"></i>
    </a>

    <?php if($data->print_is_enabled ?? true): ?>
        <button type="button" class="<?= $data->class ?>" style="color: #808080;" data-toggle="tooltip" title="<?= l('page.print') ?>" onclick="window.print()" data-tooltip-hide-on-click>
            <i class="fas fa-fw fa-sm fa-print"></i>
        </button>
    <?php endif ?>

    <a href="https://www.facebook.com/sharer/sharer.php?u=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" style="color: #1877F2;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), 'Facebook') ?>">
        <i class="fab fa-fw fa-facebook"></i>
    </a>

    <a href="https://x.com/share?url=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" style="color: #1DA1F2;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), 'X') ?>">
        <i class="fab fa-fw fa-twitter"></i>
    </a>

    <a href="https://pinterest.com/pin/create/link/?url=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" style="color: #E60023;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), 'Pinterest') ?>">
        <i class="fab fa-fw fa-pinterest"></i>
    </a>

    <a href="https://linkedin.com/shareArticle?url=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" style="color: #0077B5;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), 'LinkedIn') ?>">
        <i class="fab fa-fw fa-linkedin"></i>
    </a>

    <a href="https://www.reddit.com/submit?url=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" style="color: #FF4500;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), 'Reddit') ?>">
        <i class="fab fa-fw fa-reddit"></i>
    </a>

    <a href="https://wa.me/?text=<?= $data->url ?>" class="<?= $data->class ?>" style="color: #25D366;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), 'Whatsapp') ?>">
        <i class="fab fa-fw fa-whatsapp"></i>
    </a>

    <a href="https://t.me/share/url?url=<?= $data->url ?>" class="<?= $data->class ?>" style="color: #0088cc;" data-toggle="tooltip" title="<?= sprintf(l('global.share_via'), 'Telegram') ?>">
        <i class="fab fa-fw fa-telegram"></i>
    </a>
<?php else: ?>
    <button type="button" class="<?= $data->class ?> d-none" title="<?= sprintf(l('global.share_via'), l('global.device')) ?>" data-native-share>
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/globe-alt.svg') ?></div>
    </button>

    <a href="mailto:?body=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" title="<?= sprintf(l('global.share_via'), 'Email') ?>">
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/email.svg') ?></div>
    </a>

    <?php if($data->print_is_enabled ?? true): ?>
        <button type="button" class="<?= $data->class ?>" title="<?= l('page.print') ?>" onclick="window.print()" data-tooltip-hide-on-click>
            <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/pdf.svg') ?></div>
        </button>
    <?php endif ?>

    <a href="https://www.facebook.com/sharer/sharer.php?u=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" title="<?= sprintf(l('global.share_via'), 'Facebook') ?>">
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/facebook.svg') ?></div>
    </a>

    <a href="https://x.com/share?url=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" title="<?= sprintf(l('global.share_via'), 'X') ?>">
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/x.svg') ?></div>
    </a>

    <a href="https://pinterest.com/pin/create/link/?url=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" title="<?= sprintf(l('global.share_via'), 'Pinterest') ?>">
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/pinterest.svg') ?></div>
    </a>

    <a href="https://linkedin.com/shareArticle?url=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" title="<?= sprintf(l('global.share_via'), 'LinkedIn') ?>">
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/linkedin.svg') ?></div>
    </a>

    <a href="https://www.reddit.com/submit?url=<?= $data->url ?>" target="_blank" class="<?= $data->class ?>" title="<?= sprintf(l('global.share_via'), 'Reddit') ?>">
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/reddit.svg') ?></div>
    </a>

    <a href="https://wa.me/?text=<?= $data->url ?>" class="<?= $data->class ?>" title="<?= sprintf(l('global.share_via'), 'Whatsapp') ?>">
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/whatsapp.svg') ?></div>
    </a>

    <a href="https://t.me/share/url?url=<?= $data->url ?>" class="<?= $data->class ?>" title="<?= sprintf(l('global.share_via'), 'Telegram') ?>">
        <div class="svg-sm d-flex"><?= include_view(ASSETS_PATH . '/images/icons/telegram.svg') ?></div>
    </a>
<?php endif ?>

<?php ob_start() ?>
    <script>
        document.querySelectorAll('[data-native-share]').forEach(element => {
            if(navigator.share) {
                element.classList.remove('d-none');
                element.addEventListener('click', event => {
                    navigator.share({
                        title: document.title,
                        url: "<?= $data->url ?>"
                    }).catch(error => {});
                })
            }
        })
    </script>
<?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'native_share') ?>
