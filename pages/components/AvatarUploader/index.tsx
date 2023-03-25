import React, { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';

import { useTranslation } from 'next-i18next';

import styles from './index.module.scss';

const AvatarUploader: React.FC<{
    title: string;
    img: string;
    updateAvatar?: (img: string) => void;
}> = ({ title, img, updateAvatar }) => {
    const fileInput = useRef<HTMLInputElement | null>(null);

    const editor = useRef<AvatarEditor | null>(null);

    const [avatar, setAvatar] = useState<{
        img: string;
        scale: number;
        rotate: number;
        position: { x: number; y: number };
    }>({
        img: img,
        scale: 1,
        rotate: 0,
        position: { x: 0, y: 0 },
    });

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatar((state) => ({
                    ...state,
                    img: (reader.result as string) || '',
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (editor.current && avatar.img) {
            const canvas = editor.current.getImage();
            const dataURL = canvas.toDataURL();

            // 处理获取到的dataURL
            updateAvatar?.(dataURL);
        }
    };

    const handleScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const scale = parseFloat(event.target.value);
        setAvatar((state) => ({ ...state, scale }));
    };

    const handleRotateLeft = () => {
        setAvatar((state) => ({ ...state, rotate: state.rotate - 90 }));
    };

    const handleRotateRight = () => {
        setAvatar((state) => ({ ...state, rotate: state.rotate + 90 }));
    };

    const { t } = useTranslation();

    return (
        <div className={styles.avatarUploader}>
            <div className={styles.title}>{title || '头像设置'}</div>
            <div className={styles.avatarEditorWrapperOuter}>
                <i
                    className="fas fa-rotate-left"
                    onClick={handleRotateLeft}
                ></i>
                <div
                    className={styles.avatarEditorWrapper}
                    onClick={() => {
                        fileInput.current?.click();
                    }}
                >
                    <AvatarEditor
                        image={avatar.img as string}
                        width={100}
                        height={100}
                        border={20}
                        borderRadius={80}
                        color={[255, 255, 255, 0.6]} // RGBA
                        scale={avatar.scale}
                        rotate={avatar.rotate}
                        ref={(e) => (editor.current = e)}
                    />
                    <input
                        type="file"
                        onChange={handleImageChange}
                        style={{
                            display: 'none',
                        }}
                        ref={(ele) => (fileInput.current = ele)}
                    />
                </div>
                <i
                    className="fas fa-rotate-right"
                    onClick={handleRotateRight}
                ></i>
            </div>
            <div className={styles.avatarScaleControl}>
                <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.01"
                    value={avatar.scale}
                    onChange={handleScaleChange}
                />
            </div>
            <button className={styles.saveButton} onClick={handleSave}>
                {t('save')}
            </button>
        </div>
    );
};

export default AvatarUploader;
