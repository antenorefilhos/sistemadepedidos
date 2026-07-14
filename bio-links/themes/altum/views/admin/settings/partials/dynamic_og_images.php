<?php defined('ALTUMCODE') || die() ?>

<div>
    <div <?= !\Altum\Plugin::is_active('dynamic-og-images') ? 'data-toggle="tooltip" title="' . sprintf(l('admin_plugins.no_access'), \Altum\Plugin::get('dynamic-og-images')->name ?? 'dynamic-og-images') . '"' : null ?>>
        <div class="<?= !\Altum\Plugin::is_active('dynamic-og-images') ? 'container-disabled' : null ?>">
            <div class="form-group custom-control custom-switch">
                <input id="is_enabled" name="is_enabled" type="checkbox" class="custom-control-input" <?= \Altum\Plugin::is_active('dynamic-og-images') && settings()->dynamic_og_images->is_enabled ? 'checked="checked"' : null?>>
                <label class="custom-control-label" for="is_enabled"><?= l('admin_settings.dynamic_og_images.is_enabled') ?></label>
            </div>

            <div class="form-group">
                <label for="api_key"><i class="fas fa-fw fa-sm fa-code text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.api_key') ?></label>
                <input id="api_key" type="text" name="api_key" class="form-control" value="<?= settings()->dynamic_og_images->api_key ?>" />
                <small class="form-text text-muted"><?= l('admin_settings.dynamic_og_images.api_key_help') ?></small>
            </div>

            <div class="form-group">
                <label for="imagerypro_api_key"><i class="fas fa-fw fa-sm fa-key text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.imagerypro_api_key') ?></label>
                <input id="imagerypro_api_key" type="text" name="imagerypro_api_key" class="form-control" value="<?= settings()->dynamic_og_images->imagerypro_api_key ?>" />
                <small class="form-text text-muted"><?= l('admin_settings.dynamic_og_images.imagerypro_api_key_help') ?></small>
                <small class="form-text text-muted"><?= l('admin_settings.dynamic_og_images.imagerypro_api_key_help2') ?></small>
            </div>

            <div class="form-group">
                <label for="quality"><i class="fas fa-fw fa-sm fa-image text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.quality') ?></label>
                <div class="input-group">
                    <input id="quality" name="quality" type="number" min="50" max="100" class="form-control" value="<?= settings()->dynamic_og_images->quality ?? 90 ?>" />
                    <div class="input-group-append">
                        <span class="input-group-text">
                            %
                        </span>
                    </div>
                </div>
                <small class="form-text text-muted"><?= l('admin_settings.dynamic_og_images.quality_help') ?></small>
            </div>

            <div class="form-group">
                <label for="title"><i class="fas fa-fw fa-sm fa-heading text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.title') ?></label>
                <input id="title" type="text" name="title" class="form-control" value="<?= settings()->dynamic_og_images->title ?>" maxlength="64" />
                <small class="form-text text-muted"><?= l('admin_settings.dynamic_og_images.title_help') ?></small>
            </div>

            <div class="form-group">
                <label for="title_color"><i class="fas fa-fw fa-sm fa-palette text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.title_color') ?></label>
                <input id="title_color" type="hidden" name="title_color" class="form-control" value="<?= settings()->dynamic_og_images->title_color ?>" data-color-picker />
            </div>

            <div class="form-group" data-file-image-input-wrapper data-file-input-wrapper-size-limit="<?= get_max_upload() ?>" data-file-input-wrapper-size-limit-error="<?= sprintf(l('global.error_message.file_size_limit'), get_max_upload()) ?>">
                <label for="logo"><i class="fas fa-fw fa-sm fa-sun text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.logo') ?></label>
                <?= include_view(THEME_PATH . 'views/partials/file_image_input.php', ['uploads_file_key' => 'logo_light', 'file_key' => 'logo', 'already_existing_image' => settings()->dynamic_og_images->logo]) ?>
                <small class="form-text text-muted"><?= l('admin_settings.dynamic_og_images.logo_help') ?></small>
                <small class="form-text text-muted"><?= sprintf(l('global.accessibility.whitelisted_file_extensions'), \Altum\Uploads::get_whitelisted_file_extensions_accept('logo_light')) . ' ' . sprintf(l('global.accessibility.file_size_limit'), get_max_upload()) ?></small>
            </div>

            <div class="form-group" data-file-image-input-wrapper data-file-input-wrapper-size-limit="<?= get_max_upload() ?>" data-file-input-wrapper-size-limit-error="<?= sprintf(l('global.error_message.file_size_limit'), get_max_upload()) ?>">
                <label for="background"><i class="fas fa-fw fa-sm fa-fill text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.background') ?></label>
                <?= include_view(THEME_PATH . 'views/partials/file_image_input.php', ['uploads_file_key' => 'logo_light', 'file_key' => 'background', 'already_existing_image' => settings()->dynamic_og_images->background]) ?>
                <small class="form-text text-muted"><?= l('admin_settings.dynamic_og_images.background_help') ?></small>
                <small class="form-text text-muted"><?= sprintf(l('global.accessibility.whitelisted_file_extensions'), \Altum\Uploads::get_whitelisted_file_extensions_accept('logo_light')) . ' ' . sprintf(l('global.accessibility.file_size_limit'), get_max_upload()) ?></small>
            </div>

            <div class="form-group">
                <label for="background_color"><i class="fas fa-fw fa-sm fa-palette text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.background_color') ?></label>
                <input id="background_color" type="hidden" name="background_color" class="form-control" value="<?= settings()->dynamic_og_images->background_color ?>" data-color-picker />
            </div>

            <div class="form-group">
                <label for="screenshot_image_border_radius"><i class="fas fa-fw fa-sm fa-square text-muted mr-1"></i> <?= l('admin_settings.dynamic_og_images.screenshot_image_border_radius') ?></label>
                <div class="input-group">
                    <input id="screenshot_image_border_radius" name="screenshot_image_border_radius" type="number" min="0" max="40" class="form-control" value="<?= settings()->dynamic_og_images->screenshot_image_border_radius ?? 30 ?>" />
                    <div class="input-group-append">
                        <span class="input-group-text">
                            px
                        </span>
                    </div>
                </div>
                <small class="form-text text-muted"><?= l('admin_settings.dynamic_og_images.screenshot_image_border_radius_help') ?></small>
            </div>
        </div>
    </div>
</div>

<?php if(\Altum\Plugin::is_active('dynamic-og-images')): ?>
    <button type="submit" name="submit" class="btn btn-lg btn-block btn-primary mt-4"><?= l('global.update') ?></button>
<?php endif ?>

<?php include_view(THEME_PATH . 'views/partials/color_picker_js.php') ?>
