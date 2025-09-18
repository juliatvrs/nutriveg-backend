CREATE DATABASE nutriveg;

USE nutriveg;

CREATE TABLE `usuario` (
  `id_usuario` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `tipo` enum('membro','nutricionista') NOT NULL,
  `foto_perfil` varchar(150) DEFAULT NULL,
  `foto_capa` varchar(150) DEFAULT NULL,
  `senha` char(64) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `nutricionista` (
  `usuario_id` int unsigned NOT NULL,
  `CRN` varchar(10) NOT NULL,
  `telefone` char(11) DEFAULT NULL,
  `foco` enum('vegana','vegetariana','vegana_e_vegetariana') DEFAULT NULL,
  `site` VARCHAR(500) DEFAULT NULL,
  `instagram` VARCHAR(100) DEFAULT NULL,
  `linkedin` VARCHAR(150) DEFAULT NULL,
  `uf` varchar(45) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `formacao` varchar(70) DEFAULT NULL,
  `sobre` VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`usuario_id`),
  KEY `fk_nutricionista_usuario1_idx` (`usuario_id`),
  CONSTRAINT `fk_nutricionista_usuario1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `artigo` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `texto` longtext NOT NULL,
  `imagem` varchar(150) NOT NULL,
  `id_nutricionista` int unsigned NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `contador_visualizacoes` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_artigo_nutricionista1_idx` (`id_nutricionista`),
  CONSTRAINT `fk_artigo_nutricionista1` FOREIGN KEY (`id_nutricionista`) REFERENCES `nutricionista` (`usuario_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='	';

CREATE TABLE `receitas` (
  `id_receitas` int unsigned NOT NULL AUTO_INCREMENT,
  `rendimento` varchar(2) NOT NULL,
  `nome_da_receita` varchar(150) NOT NULL,
  `introducao` varchar(300) NOT NULL,
  `tempo_de_preparo` time NOT NULL,
  `alimentacao` enum('vegano','vegetariano') NOT NULL,
  `imagem` varchar(150) NOT NULL,
  `id_usuario` int unsigned NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_receitas`),
  KEY `fk_receitas_usuario1_idx` (`id_usuario`),
  CONSTRAINT `fk_receitas_usuario1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `avaliacao` (
  `nota` int DEFAULT NULL,
  `id_receitas` int unsigned NOT NULL,
  `id_usuario` int unsigned NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_receitas`,`id_usuario`),
  KEY `id_usuario_idx` (`id_usuario`),
  CONSTRAINT `id_avaliacao_receitas` FOREIGN KEY (`id_receitas`) REFERENCES `receitas` (`id_receitas`) ON DELETE CASCADE,
  CONSTRAINT `id_avaliacao_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `categoria` (
  `cafe` tinyint(1) NOT NULL DEFAULT '0',
  `lanche_sobremesa` tinyint(1) NOT NULL DEFAULT '0',
  `almoco_jantar` tinyint(1) NOT NULL DEFAULT '0',
  `id_usuario` int unsigned NOT NULL,
  `id_receitas` int unsigned NOT NULL,
  KEY `fk_categoria_usuario` (`id_usuario`),
  KEY `fk_categoria_receitas` (`id_receitas`),
  CONSTRAINT `fk_categoria_receitas` FOREIGN KEY (`id_receitas`) REFERENCES `receitas` (`id_receitas`) ON DELETE CASCADE,
  CONSTRAINT `fk_categoria_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `etapa` (
  `id_etapa` int unsigned NOT NULL AUTO_INCREMENT,
  `id_receitas` int unsigned NOT NULL,
  `descricao` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`id_etapa`),
  KEY `id_receitas_idx` (`id_receitas`),
  CONSTRAINT `fk_etapa_receitas` FOREIGN KEY (`id_receitas`) REFERENCES `receitas` (`id_receitas`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `ingrediente` (
  `id_ingrediente` int unsigned NOT NULL AUTO_INCREMENT,
  `id_receitas` int unsigned NOT NULL,
  `nome` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id_ingrediente`),
  KEY `id_receitas_idx` (`id_receitas`),
  CONSTRAINT `id_receitas` FOREIGN KEY (`id_receitas`) REFERENCES `receitas` (`id_receitas`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;